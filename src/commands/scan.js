const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const {
  banner,
  heading,
  info,
  step,
  success,
  warn,
  error,
  dim
} = require("../lib/ui");
const { dirExists } = require("../lib/fs");
const { userConfigPath } = require("../lib/paths");
const { readCache, writeCache, cacheKeyForSkill } = require("../lib/cache");
const crypto = require("crypto");
const {
  auditorCliCommand,
  normalizeAuditor,
  defaultConfig,
  loadMergedConfig,
  userConfigExists,
  writeUserConfig
} = require("../lib/config");
const {
  resolveAuditorCli,
  listAuditorStatus,
  pickDefaultAuditor
} = require("../lib/auditor");
const { discoverSkills } = require("../lib/skills");
const { runAuditor } = require("../lib/audit");

function expandHome(input) {
  if (!input) {
    return input;
  }
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

function normalizeRoots(roots) {
  return roots.map((root) => path.resolve(expandHome(root)));
}

function pruneNestedRoots(roots) {
  const unique = Array.from(new Set(roots));
  const sorted = unique.slice().sort((a, b) => a.length - b.length);
  const kept = [];

  sorted.forEach((candidate) => {
    const isNested = kept.some((root) => candidate === root || candidate.startsWith(root + path.sep));
    if (!isNested) {
      kept.push(candidate);
    }
  });

  return kept;
}

function providerLabel(skill) {
  const normalizedPath = skill.path.split(path.sep).join("/");
  const normalizedRoot = (skill.root || skill.path).split(path.sep).join("/");
  if (normalizedPath.match(/\/\.?codex\/skills\/\.system\b/)) {
    return "Codex (system)";
  }
  if (normalizedRoot.match(/\/\.?codex\/skills\b/)) {
    return "Codex";
  }
  if (normalizedRoot.match(/\/\.?claude\/skills\b/)) {
    return "Claude";
  }
  if (normalizedRoot.match(/\/\.?opencode\/skills\b/)) {
    return "OpenCode";
  }
  return "Other";
}

function groupSkills(skills) {
  const groups = new Map();
  for (const skill of skills) {
    const label = providerLabel(skill);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label).push(skill);
  }
  return groups;
}

function truncateContent(content, maxLength) {
  if (content.length <= maxLength) {
    return { content, truncated: false };
  }
  return {
    content: content.slice(0, maxLength) + "\n...[truncated]...\n",
    truncated: true
  };
}

function buildPrompt(skill, content, truncated) {
  return [
    "You are a security auditor reviewing a local agent skill.",
    "Return ONLY valid JSON with this schema:",
    "{",
    '  "verdict": "safe" | "suspicious" | "unsafe",',
    '  "risk": number,',
    '  "summary": string,',
    '  "issues": [',
    '    { "title": string, "severity": "low" | "medium" | "high", "evidence": string }',
    "  ]",
    "}",
    "",
    "Skill metadata:",
    `- name: ${skill.name}`,
    `- path: ${skill.path}`,
    `- file: ${skill.file}`,
    `- content_truncated: ${truncated ? "yes" : "no"}`,
    "",
    "Skill content:",
    "```",
    content,
    "```"
  ].join("\n");
}

function startSpinner(message) {
  const frames = ["|", "/", "-", "\\"];
  let index = 0;
  process.stdout.write(`${frames[index]} ${message}`);
  const interval = setInterval(() => {
    index = (index + 1) % frames.length;
    process.stdout.write(`\r${frames[index]} ${message}`);
  }, 80);

  return () => {
    clearInterval(interval);
    process.stdout.write("\r" + " ".repeat(message.length + 2) + "\r");
  };
}

function formatTimestamp(date) {
  if (!date) {
    return "unknown";
  }
  return date.toISOString();
}

function hashSkillAudit(content, auditor) {
  const promptVersion = "v1";
  const schemaVersion = "v1";
  return crypto
    .createHash("sha256")
    .update(content)
    .update("|")
    .update(auditor)
    .update("|")
    .update(promptVersion)
    .update("|")
    .update(schemaVersion)
    .digest("hex");
}

async function ensureUserConfig(options, auditorStatus) {
  if (await userConfigExists()) {
    return false;
  }

  const config = defaultConfig();
  config.auditor = pickDefaultAuditor(auditorStatus || []);
  if (options && options.auditor) {
    const requested = String(options.auditor).toLowerCase();
    if (auditorCliCommand(requested)) {
      config.auditor = requested;
    } else {
      warn(`Unknown auditor "${options.auditor}". Using "${config.auditor}".`);
    }
  }

  await writeUserConfig(config);
  success("Created config");
  info(userConfigPath());
  return true;
}

async function runScan(scanPath, options = {}) {
  banner();
  heading("SkillGuard Scan");

  const root = path.resolve(scanPath || process.cwd());
  if (!(await dirExists(root))) {
    error(`Scan path not found: ${root}`);
    return 1;
  }

  const auditorStatus = listAuditorStatus();
  await ensureUserConfig(options, auditorStatus);

  const config = await loadMergedConfig();
  if (options.auditor) {
    const requested = String(options.auditor).toLowerCase();
    if (auditorCliCommand(requested)) {
      config.auditor = requested;
    } else {
      warn(`Unknown auditor "${options.auditor}". Using "${config.auditor}".`);
    }
  }

  const verbose = Boolean(options && options.verbose);
  if (verbose) {
    info("Auditor CLI availability:");
    auditorStatus.forEach((item) => {
      const state = item.available ? "available" : "missing";
      const suffix = item.available ? ` (${item.path})` : "";
      info(`- ${item.auditor} (${item.command}): ${state}${suffix}`);
    });
    info(`Config path: ${userConfigPath()}`);
  }
  step(`Auditor: ${config.auditor}`);

  const auditorCli = resolveAuditorCli(config.auditor);
  const supportedAuditors = new Set(["claude", "codex"]);
  let auditMessage = "not run";
  let exitCode = 0;

  if (!auditorCli) {
    warn("Unknown auditor configured; skipping audit.");
    auditMessage = "skipped (unknown auditor)";
    exitCode = 2;
  } else if (!supportedAuditors.has(config.auditor)) {
    warn(`Auditor not supported yet: ${config.auditor}.`);
    auditMessage = "skipped (auditor not supported yet)";
    exitCode = 2;
  } else if (!auditorCli.path) {
    warn(`Missing auditor CLI: ${auditorCli.command}.`);
    auditMessage = `skipped (${auditorCli.command} not found)`;
    exitCode = 2;
  } else {
    step(`Auditor CLI found: ${auditorCli.command}`);
    auditMessage = `ready (${config.auditor})`;
  }

  const scanRoots = scanPath
    ? [root]
    : Array.isArray(config.scan && config.scan.autoRoots)
      ? config.scan.autoRoots
      : [];

  if (!scanRoots.length) {
    warn("No scan roots configured. Add paths to scan.autoRoots in config.");
    return 2;
  }

  const resolvedRoots = pruneNestedRoots(normalizeRoots(scanRoots));
  const { skills, missingRoots } = await discoverSkills(resolvedRoots, {
    maxDepth: 6,
    ignoreDirs: [".git", "node_modules", ".skillguard"]
  });

  const missingSet = new Set(missingRoots);
  const existingRoots = resolvedRoots.filter((rootPath) => !missingSet.has(rootPath));

  if (!existingRoots.length) {
    warn("No scan roots found on disk. Configure scan.autoRoots or pass a path.");
    return 2;
  }

  if (verbose) {
    console.log("");
    info("Scan roots:");
    existingRoots.forEach((rootPath) => info(`- ${rootPath}`));
    if (missingRoots.length && existingRoots.length) {
      dim(`Skipped ${missingRoots.length} missing root(s) not found on disk.`);
    }
  }

  if (!skills.length) {
    warn("No skills found.");
    return exitCode;
  }

  success(`Found ${skills.length} skills`);

  const auditResults = new Map();
  const auditDetails = new Map();
  const auditUpdatedAt = new Map();
  if (auditMessage.startsWith("ready")) {
    info(`Skill audit: running (${config.auditor}).`);
    const useCache = config.cache && config.cache.enabled && !options.force;
    const cache = useCache ? await readCache() : { version: 1, entries: {} };
    for (const skill of skills) {
      const stop = verbose ? () => {} : startSpinner(`Auditing ${skill.name}`);
      try {
        if (verbose) {
          info(`Auditing ${skill.name}...`);
        }
        const [rawContent, stat] = await Promise.all([
          fs.readFile(skill.file, "utf8"),
          fs.stat(skill.file)
        ]);
        const updatedAt = stat && stat.mtime ? stat.mtime : null;
        auditUpdatedAt.set(skill.path, updatedAt);
        const contentHash = hashSkillAudit(rawContent, config.auditor);
        const cacheKey = cacheKeyForSkill(skill.path);
        const cachedEntry = useCache ? cache.entries[cacheKey] : null;
        if (cachedEntry && cachedEntry.hash === contentHash && cachedEntry.verdict) {
          auditResults.set(skill.path, `audited (cached ${cachedEntry.verdict})`);
          if (cachedEntry.verdict !== "safe") {
            auditDetails.set(skill.path, {
              summary: cachedEntry.summary,
              issues: Array.isArray(cachedEntry.issues) ? cachedEntry.issues : []
            });
          }
          continue;
        }
        const { content, truncated } = truncateContent(rawContent, 12000);
        const prompt = buildPrompt(skill, content, truncated);
        const result = await runAuditor(config.auditor, prompt, {
          onStdout: verbose
            ? (text) => {
                process.stdout.write(text);
              }
            : null,
          onStderr: verbose
            ? (text) => {
                process.stderr.write(text);
              }
            : null
        });
        if (result.ok && result.parsed && result.parsed.verdict) {
          auditResults.set(skill.path, `audited (${result.parsed.verdict})`);
          if (result.parsed.verdict !== "safe") {
            auditDetails.set(skill.path, {
              summary: result.parsed.summary,
              issues: Array.isArray(result.parsed.issues) ? result.parsed.issues : []
            });
          }
          if (useCache) {
            cache.entries[cacheKey] = {
              hash: contentHash,
              verdict: result.parsed.verdict,
              summary: result.parsed.summary,
              issues: Array.isArray(result.parsed.issues) ? result.parsed.issues : [],
              auditedAt: new Date().toISOString()
            };
          }
        } else if (result.ok) {
          auditResults.set(skill.path, "audited (unstructured response)");
        } else {
          auditResults.set(
            skill.path,
            `audit failed (exit ${result.exitCode || "unknown"})`
          );
          if (verbose && result.stderr) {
            warn(`Audit stderr for ${skill.name}: ${result.stderr.trim()}`);
          }
        }
      } catch (err) {
        auditResults.set(skill.path, "audit failed (read error)");
        if (verbose) {
          warn(`Audit error for ${skill.name}: ${err.message}`);
        }
      } finally {
        stop();
      }
    }
    if (useCache) {
      await writeCache(cache);
    }
    info("Skill audit: completed.");
  } else {
    info(`Skill audit: ${auditMessage}.`);
  }
  info("Skills by source:");
  const groups = groupSkills(skills);
  const orderedLabels = ["Claude", "Codex (system)", "Codex", "OpenCode", "Other"];
  const extraLabels = Array.from(groups.keys()).filter((label) => !orderedLabels.includes(label));
  const labels = [...orderedLabels, ...extraLabels];

  labels.forEach((label) => {
    const group = groups.get(label);
    if (!group || !group.length) {
      return;
    }
    console.log(`- ${label}`);
    group
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((skill) => {
        console.log(`  - ${skill.name}`);
        dim(`    path: ${skill.path}`);
        const auditStatus = auditResults.get(skill.path);
        dim(`    status: ${auditStatus || "discovered (SKILL.md found)"}`);
        const updatedAt = auditUpdatedAt.get(skill.path);
        if (updatedAt) {
          dim(`    updated: ${formatTimestamp(updatedAt)}`);
        }
        const details = auditDetails.get(skill.path);
        if (details) {
          if (details.summary) {
            dim(`    summary: ${details.summary}`);
          }
          if (details.issues && details.issues.length) {
            details.issues.forEach((issue) => {
              const title = issue && issue.title ? issue.title : "Issue";
              const severity = issue && issue.severity ? issue.severity : "unknown";
              dim(`    issue: [${severity}] ${title}`);
            });
          }
        }
      });
  });

  return exitCode;
}

module.exports = {
  runScan
};
