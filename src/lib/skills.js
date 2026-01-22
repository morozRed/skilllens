const fs = require("fs/promises");
const path = require("path");

const SKILL_FILENAMES = new Set(["SKILL.md", "skill.md"]);

async function isDirectory(target) {
  try {
    const stat = await fs.stat(target);
    return stat.isDirectory();
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

async function discoverSkills(roots, options = {}) {
  const skills = [];
  const missingRoots = [];
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 6;
  const ignoreDirs = new Set(options.ignoreDirs || []);

  for (const root of roots) {
    const resolvedRoot = path.resolve(root);
    if (!(await isDirectory(resolvedRoot))) {
      missingRoots.push(resolvedRoot);
      continue;
    }

    const stack = [{ dir: resolvedRoot, depth: 0 }];

    while (stack.length) {
      const { dir, depth } = stack.pop();
      let entries;

      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch (err) {
        if (err && err.code === "ENOENT") {
          continue;
        }
        throw err;
      }

      const skillFile = entries.find(
        (entry) => entry.isFile() && SKILL_FILENAMES.has(entry.name)
      );

      if (skillFile) {
        const resolvedPath = path.resolve(dir);
        skills.push({
          name: path.basename(dir),
          path: resolvedPath,
          file: path.join(resolvedPath, skillFile.name),
          root: resolvedRoot
        });
      }

      if (depth >= maxDepth) {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        if (ignoreDirs.has(entry.name)) {
          continue;
        }
        stack.push({ dir: path.join(dir, entry.name), depth: depth + 1 });
      }
    }
  }

  return { skills, missingRoots };
}

module.exports = {
  discoverSkills
};
