const chalk = require("chalk");

function bannerText() {
  return [
    "███████╗██╗  ██╗██╗██╗     ██╗     ",
    "██╔════╝██║ ██╔╝██║██║     ██║     ",
    "███████╗█████╔╝ ██║██║     ██║     ",
    "╚════██║██╔═██╗ ██║██║     ██║     ",
    "███████║██║  ██╗██║███████╗███████╗",
    "╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝",
    "",
    " ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ ",
    "██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗",
    "██║  ███╗██║   ██║███████║██████╔╝██║  ██║",
    "██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║",
    "╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝",
    " ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ "
  ].join("\n");
}

function banner() {
  const lines = bannerText().split("\n");
  const colors = [
    chalk.bold.white,
    chalk.bold.cyanBright,
    chalk.cyanBright,
    chalk.cyan,
    chalk.blue,
    chalk.dim.blue,
    null, // empty line
    chalk.bold.white,
    chalk.bold.cyanBright,
    chalk.cyanBright,
    chalk.cyan,
    chalk.blue,
    chalk.dim.blue
  ];

  console.log("");
  lines.forEach((line, i) => {
    if (colors[i]) {
      console.log(colors[i](line));
    } else {
      console.log(line);
    }
  });
  console.log("");
}

function label(text, color) {
  return chalk[color](`[${text}]`);
}

function heading(text) {
  console.log(chalk.bold.cyan(text));
  console.log(chalk.dim("-".repeat(text.length)));
}

function info(message) {
  console.log(`${label("..", "blue")} ${message}`);
}

function step(message) {
  console.log(`${label("->", "cyan")} ${message}`);
}

function success(message) {
  console.log(`${label("ok", "green")} ${message}`);
}

function warn(message) {
  console.log(`${label("!!", "yellow")} ${message}`);
}

function error(message) {
  console.log(`${label("xx", "red")} ${message}`);
}

function dim(message) {
  console.log(chalk.dim(message));
}

module.exports = {
  bannerText,
  banner,
  heading,
  info,
  step,
  success,
  warn,
  error,
  dim
};
