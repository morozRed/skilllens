import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "string",
      enum: ["safe", "suspicious", "unsafe"]
    },
    risk: {
      type: "number",
      minimum: 0,
      maximum: 10
    },
    summary: {
      type: "string"
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          evidence: { type: "string" }
        },
        required: ["title", "severity", "evidence"]
      }
    }
  },
  required: ["verdict", "risk", "summary", "issues"]
};

let schemaFilePath = null;

async function ensureSchemaFile() {
  if (schemaFilePath) {
    return schemaFilePath;
  }
  const filePath = path.join(os.tmpdir(), "skillguard-audit-schema.json");
  await fs.writeFile(filePath, JSON.stringify(AUDIT_SCHEMA, null, 2), "utf8");
  schemaFilePath = filePath;
  return filePath;
}

async function argsForAuditor(auditor: string, prompt: string) {
  if (auditor === "codex") {
    const schemaPath = await ensureSchemaFile();
    return ["exec", prompt, "--skip-git-repo-check", "--output-schema", schemaPath];
  }
  if (auditor === "claude") {
    const schemaArg = JSON.stringify(AUDIT_SCHEMA);
    return ["-p", prompt, "--output-format", "json", "--json-schema", schemaArg];
  }
  throw new Error(`Unsupported auditor: ${auditor}`);
}

function normalizeParsed(rawParsed: unknown) {
  if (rawParsed && typeof rawParsed === "object") {
    const obj = rawParsed as { structured_output?: unknown };
    if (obj.structured_output && typeof obj.structured_output === "object") {
      return obj.structured_output;
    }
  }
  return rawParsed;
}

function parseAuditorOutput(stdout: string) {
  const text = stdout.trim();
  if (!text) {
    return { parsed: null, rawParsed: null };
  }

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  };

  let rawParsed = tryParse(text);
  if (!rawParsed) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      rawParsed = tryParse(lines[i]);
      if (rawParsed) {
        break;
      }
    }
  }

  if (!rawParsed) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawParsed = tryParse(text.slice(firstBrace, lastBrace + 1));
    }
  }

  return { parsed: normalizeParsed(rawParsed), rawParsed };
}

type AuditorResult = {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  parsed: any;
};

type AuditorRunOptions = {
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
};

function runAuditor(auditor: string, prompt: string, options: AuditorRunOptions = {}): Promise<AuditorResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let exitCode = null;
    let settled = false;

    let child = null;

    (async () => {
      let args;
      try {
        args = await argsForAuditor(auditor, prompt);
      } catch (err) {
        resolve({ ok: false, exitCode: 2, stdout: "", stderr: err.message, parsed: null });
        return;
      }

      child = spawn(auditor, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });

      child.stdout.on("data", (chunk) => {
        const text = chunk.toString("utf8");
        stdout += text;
        if (typeof options.onStdout === "function") {
          options.onStdout(text);
        }
      });

      child.stderr.on("data", (chunk) => {
        const text = chunk.toString("utf8");
        stderr += text;
        if (typeof options.onStderr === "function") {
          options.onStderr(text);
        }
      });

      child.on("close", (code) => {
        if (settled) {
          return;
        }
        settled = true;
        exitCode = code;
        const { parsed } = parseAuditorOutput(stdout);
        resolve({
          ok: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          parsed
        });
      });

      child.on("error", (err) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({ ok: false, exitCode, stdout, stderr: err.message, parsed: null });
      });
    })();
  });
}

export {
  runAuditor
};
