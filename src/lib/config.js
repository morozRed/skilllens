const os = require("os");
const path = require("path");
const { readJson, writeJson, fileExists } = require("./fs");
const { userConfigPath } = require("./paths");

const AUDITOR_CLI = {
  claude: "claude",
  codex: "codex",
};

const DEFAULT_AUDITOR = "claude";

function auditorCliCommand(auditor) {
  if (!auditor) {
    return null;
  }
  return AUDITOR_CLI[String(auditor).toLowerCase()] || null;
}

function normalizeAuditor(auditor) {
  if (!auditor) {
    return DEFAULT_AUDITOR;
  }
  const key = String(auditor).toLowerCase();
  return AUDITOR_CLI[key] ? key : DEFAULT_AUDITOR;
}

function defaultScanRoots() {
  const home = os.homedir();
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  const xdgData = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
  const roots = [
    path.join(home, ".claude", "skills"),
    path.join(home, ".opencode", "skills"),
    path.join(home, ".codex", "skills"),
    path.join(home, ".codex", "skills", ".system"),
    path.join(xdgConfig, "claude", "skills"),
    path.join(xdgConfig, "opencode", "skills"),
    path.join(xdgConfig, "codex", "skills"),
    path.join(xdgData, "claude", "skills"),
    path.join(xdgData, "opencode", "skills"),
    path.join(xdgData, "codex", "skills")
  ];

  return Array.from(new Set(roots));
}

function defaultConfig() {
  return {
    auditor: DEFAULT_AUDITOR,
    scan: {
      autoRoots: defaultScanRoots()
    },
    redaction: {
      enabled: true,
      patterns: []
    },
    upload: {
      maxFiles: 200,
      maxBytes: 2000000
    },
    cache: {
      enabled: true
    }
  };
}

function mergeDeep(target, source) {
  if (!source || typeof source !== "object") {
    return target;
  }
  const output = Array.isArray(target) ? target.slice() : { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const base = output[key] && typeof output[key] === "object" ? output[key] : {};
      output[key] = mergeDeep(base, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

async function loadUserConfig() {
  return (await readJson(userConfigPath())) || {};
}

async function loadMergedConfig() {
  const base = defaultConfig();
  const userConfig = await loadUserConfig();
  return mergeDeep(base, userConfig);
}

async function writeUserConfig(config) {
  await writeJson(userConfigPath(), config);
}

async function userConfigExists() {
  return fileExists(userConfigPath());
}

module.exports = {
  auditorCliCommand,
  normalizeAuditor,
  defaultConfig,
  defaultScanRoots,
  mergeDeep,
  loadMergedConfig,
  loadUserConfig,
  writeUserConfig,
  userConfigExists,
  AUDITOR_CLI
};
