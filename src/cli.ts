import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { bannerText } from "./lib/ui.js";
import { runScan } from "./commands/scan.js";
import { runConfigShow } from "./commands/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.resolve(__dirname, "../../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

function commandResult(promise) {
  return promise.then((code) => {
    if (typeof code === "number") {
      process.exitCode = code;
    }
  });
}

function main(argv = process.argv.slice(2)) {
  const program = new Command();

  program
    .name("skilllens")
    .description("Scan local agent skills/tools and show findings.")
    .version(pkg.version)
    .addHelpText("before", `${bannerText()}\n`);

  program
    .command("scan [path]")
    .description("Scan configured skills paths (or provided path) and show findings.")
    .option("--auditor <auditor>", "Select auditor: claude, codex")
    .option("--verbose", "Show verbose audit output (disables spinner)")
    .option("--force", "Force re-audit (ignore cached results)")
    .action((path, options) => commandResult(runScan(path, options)));

  program
    .command("config")
    .description("Show config and its path.")
    .action(() => commandResult(runConfigShow()));

  return program.parseAsync(argv, { from: "user" });
}

export { main };
