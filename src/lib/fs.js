const fs = require("fs/promises");
const path = require("path");

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  if (!(await fileExists(filePath))) {
    return null;
  }
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  const data = JSON.stringify(value, null, 2) + "\n";
  await fs.writeFile(filePath, data, "utf8");
}

module.exports = {
  fileExists,
  dirExists,
  ensureDir,
  readJson,
  writeJson
};
