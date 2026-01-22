const { auditorCliCommand, AUDITOR_CLI } = require("./config");
const { findExecutable } = require("./exec");

function resolveAuditorCli(auditor) {
  const command = auditorCliCommand(auditor);
  if (!command) {
    return null;
  }
  const resolvedPath = findExecutable(command);
  return {
    command,
    path: resolvedPath
  };
}

function isAuditorAvailable(auditor) {
  const resolved = resolveAuditorCli(auditor);
  return Boolean(resolved && resolved.path);
}

function listAuditorStatus() {
  return Object.entries(AUDITOR_CLI).map(([auditor, command]) => {
    const resolvedPath = findExecutable(command);
    return {
      auditor,
      command,
      path: resolvedPath,
      available: Boolean(resolvedPath)
    };
  });
}

function pickDefaultAuditor(statusList) {
  const preferred = ["claude", "codex", "opencode"];
  for (const auditor of preferred) {
    const match = statusList.find(
      (item) => item.auditor === auditor && item.available
    );
    if (match) {
      return match.auditor;
    }
  }
  return "claude";
}

module.exports = {
  resolveAuditorCli,
  isAuditorAvailable,
  listAuditorStatus,
  pickDefaultAuditor
};
