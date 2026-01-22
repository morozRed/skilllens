const fs = require("fs");
const path = require("path");

function hasPathSeparator(command) {
  return command.includes(path.sep) || (path.sep === "\\" && command.includes("/"));
}

function isExecutable(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return false;
    }
    if (process.platform === "win32") {
      return true;
    }
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function executableCandidates(command) {
  if (process.platform !== "win32") {
    return [command];
  }

  const hasExt = Boolean(path.extname(command));
  if (hasExt) {
    return [command];
  }

  const rawExts = process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM";
  const exts = rawExts.split(";").filter(Boolean);
  return exts.map((ext) => `${command}${ext}`);
}

function findExecutable(command) {
  if (!command) {
    return null;
  }

  const candidates = executableCandidates(command);

  if (hasPathSeparator(command)) {
    for (const candidate of candidates) {
      if (isExecutable(candidate)) {
        return path.resolve(candidate);
      }
    }
    return null;
  }

  const envPath = process.env.PATH || "";
  const pathDirs = envPath.split(path.delimiter).filter(Boolean);

  for (const dir of pathDirs) {
    for (const candidate of candidates) {
      const fullPath = path.join(dir, candidate);
      if (isExecutable(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

module.exports = {
  findExecutable
};
