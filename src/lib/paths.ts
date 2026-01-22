import * as os from "node:os";
import * as path from "node:path";

function userConfigPath() {
  return path.join(os.homedir(), ".skillguard", "config.json");
}

function cachePath() {
  return path.join(os.homedir(), ".skillguard", "cache.json");
}

export {
  userConfigPath,
  cachePath
};
