const { Command } = require("commander");
const pkg = require("../package.json");
const { bannerText } = require("./lib/ui");
const { runScan } = require("./commands/scan");
const { runConfigShow } = require("./commands/config");

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
    .name("skillguard")
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

module.exports = {
  main
};
