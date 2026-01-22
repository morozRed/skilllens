const fs = require("fs/promises");
const { fileExists } = require("./fs");
const { cachePath } = require("./paths");

const CACHE_VERSION = 1;

async function readCache() {
  const filePath = cachePath();
  if (!(await fileExists(filePath))) {
    return { version: CACHE_VERSION, entries: {} };
  }
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { version: CACHE_VERSION, entries: {} };
    }
    if (parsed.version !== CACHE_VERSION || typeof parsed.entries !== "object") {
      return { version: CACHE_VERSION, entries: {} };
    }
    return parsed;
  } catch (err) {
    return { version: CACHE_VERSION, entries: {} };
  }
}

async function writeCache(cache) {
  const filePath = cachePath();
  const payload = JSON.stringify(cache, null, 2) + "\n";
  await fs.mkdir(require("path").dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, payload, "utf8");
}

function cacheKeyForSkill(skillPath) {
  return skillPath;
}

module.exports = {
  CACHE_VERSION,
  readCache,
  writeCache,
  cacheKeyForSkill
};
