import { banner, heading, info } from "../lib/ui.js";
import { loadMergedConfig } from "../lib/config.js";
import { listAuditorStatus } from "../lib/auditor.js";
import { userConfigPath } from "../lib/paths.js";

async function runConfigShow() {
  banner();
  heading("SkillGuard Config");

  const config = await loadMergedConfig();
  info(`Config path: ${userConfigPath()}`);

  const statusList = listAuditorStatus();
  if (statusList.length) {
    info("Auditor CLI availability:");
    statusList.forEach((item) => {
      const state = item.available ? "available" : "missing";
      const suffix = item.available ? ` (${item.path})` : "";
      info(`- ${item.auditor} (${item.command}): ${state}${suffix}`);
    });
  }

  console.log(JSON.stringify(config, null, 2));
  return 0;
}

export { runConfigShow };
