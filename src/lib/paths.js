const os = require("os");
const path = require("path");

function userConfigPath() {
  return path.join(os.homedir(), ".skillguard", "config.json");
}

function cachePath() {
  return path.join(os.homedir(), ".skillguard", "cache.json");
}

module.exports = {
  userConfigPath,
  cachePath
};
