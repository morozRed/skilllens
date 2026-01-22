const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { findExecutable } = require("../src/lib/exec");

test("findExecutable resolves binaries from PATH", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillguard-exec-"));
  const isWin = process.platform === "win32";
  const commandName = "mockcli";
  const filename = isWin ? `${commandName}.cmd` : commandName;
  const scriptPath = path.join(tmpDir, filename);
  const script = isWin ? "@echo off\r\necho ok\r\n" : "#!/bin/sh\necho ok\n";

  const originalPath = process.env.PATH;
  const originalPathext = process.env.PATHEXT;

  try {
    await fs.writeFile(scriptPath, script, "utf8");
    if (!isWin) {
      await fs.chmod(scriptPath, 0o755);
    } else if (!originalPathext) {
      process.env.PATHEXT = ".CMD;.EXE;.BAT;.COM";
    }

    process.env.PATH = `${tmpDir}${path.delimiter}${originalPath || ""}`;
    const resolved = findExecutable(commandName);
    assert.ok(resolved, "expected executable to be resolved");
    assert.ok(resolved.endsWith(filename));
  } finally {
    process.env.PATH = originalPath;
    if (isWin) {
      process.env.PATHEXT = originalPathext;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
