import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverSkills } from "../src/lib/skills.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("discoverSkills finds SKILL.md files", async () => {
  const fixturesRoot = path.join(__dirname, "fixtures", "skills");
  const result = await discoverSkills([fixturesRoot], { maxDepth: 6 });
  const names = result.skills.map((skill) => skill.name).sort();

  assert.deepEqual(names, ["evil-skill", "example-skill", "nested-skill"]);
  assert.equal(result.missingRoots.length, 0);

  const example = result.skills.find((skill) => skill.name === "example-skill");
  assert.equal(example.root, path.resolve(fixturesRoot));
});

test("discoverSkills reports missing roots", async () => {
  const fixturesRoot = path.join(__dirname, "fixtures", "skills");
  const missingRoot = path.join(fixturesRoot, "missing-root");
  const result = await discoverSkills([missingRoot], { maxDepth: 2 });

  assert.equal(result.skills.length, 0);
  assert.equal(result.missingRoots.length, 1);
  assert.equal(result.missingRoots[0], path.resolve(missingRoot));
});
