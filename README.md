# SkillGuard

SkillGuard is a developer CLI that scans locally installed agent skills/tools, extracts redacted evidence, sends it to an auditor, and outputs a human-friendly overview.

```
███████╗██╗  ██╗██╗██╗     ██╗
██╔════╝██║ ██╔╝██║██║     ██║
███████╗█████╔╝ ██║██║     ██║
╚════██║██╔═██╗ ██║██║     ██║
███████║██║  ██╗██║███████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝

 ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗
██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
██║  ███╗██║   ██║███████║██████╔╝██║  ██║
██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
 ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
```

## Install

Run once:

```bash
npx skillguard scan
pnpm dlx skillguard scan
bunx skillguard scan
```

Install globally:

```bash
npm i -g skillguard
pnpm add -g skillguard
bun add -g skillguard
```

## Usage

```bash
skillguard scan
skillguard scan [path] [--auditor claude|codex] /
skillguard config
```

`scan` uses `scan.autoRoots` from the config by default. Pass a path to scan a specific directory instead.
Scan output includes auditor CLI availability for `claude` and `codex`

## First-run setup (scan)

`skillguard scan` creates a global config on first run:

- User config: `~/.skillguard/config.json`

The config includes:

- `auditor` (defaults to the first available CLI)
- `scan.autoRoots` (default skill locations)

Default scan roots:

- `~/.claude/skills`
- `~/.opencode/skills`
- `~/.codex/skills`

SkillGuard also seeds `.codex/skills/.system` plus common XDG config/data locations; adjust `scan.autoRoots` as needed.

To view the current config and its path:

```bash
skillguard config
```

Edit `auditor` or `scan.autoRoots` in the config file to change the CLI tool or add skill paths.

## Notes

- The v0.1 implementation focuses on packaging and scan output. Auditor calls and deep scanning are stubbed and will evolve.
- SkillGuard uses auditor CLIs (no direct API calls). Install and login to `claude` or `codex`.
- Missing auditor CLIs still produce scan results with audit status `skipped`.

## Development

```bash
npm run lint
npm run smoke
```
