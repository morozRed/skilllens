const test = require("node:test");
const assert = require("node:assert/strict");
const {
  defaultConfig,
  defaultScanRoots,
  mergeDeep,
  normalizeAuditor,
  auditorCliCommand
} = require("../src/lib/config");
const path = require("node:path");
const os = require("node:os");

test("defaultConfig returns a fresh copy", () => {
  const first = defaultConfig();
  first.scan.autoRoots.push("/tmp");
  const second = defaultConfig();
  assert.ok(!second.scan.autoRoots.includes("/tmp"));
});

test("mergeDeep merges nested objects", () => {
  const base = {
    scan: { autoRoots: [] },
    cache: { enabled: true }
  };
  const override = {
    scan: { autoRoots: ["/tmp"] },
    cache: { enabled: false }
  };
  const merged = mergeDeep(base, override);
  assert.deepEqual(merged.scan.autoRoots, ["/tmp"]);
  assert.equal(merged.cache.enabled, false);
});

test("normalizeAuditor falls back to default", () => {
  assert.equal(normalizeAuditor("codex"), "codex");
  assert.equal(normalizeAuditor("unknown"), "claude");
});

test("auditorCliCommand maps auditors to CLI names", () => {
  assert.equal(auditorCliCommand("claude"), "claude");
  assert.equal(auditorCliCommand("codex"), "codex");
});

test("defaultScanRoots includes common skill locations", () => {
  const roots = defaultScanRoots();
  const home = os.homedir();
  assert.ok(roots.includes(path.join(home, ".claude", "skills")));
  assert.ok(roots.includes(path.join(home, ".opencode", "skills")));
  assert.ok(roots.includes(path.join(home, ".codex", "skills")));
});
