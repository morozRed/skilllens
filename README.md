# SkillLens

SkillLens is a CLI tool that scans locally installed agent skills/tools, extracts redacted evidence, sends it to an auditor, and outputs a overview report.

## Install

Run once:

```bash
npx skilllens scan
pnpm dlx skilllens scan
```

Install globally:

```bash
pnpm add -g skilllens
```

## Usage

```bash
skilllens scan
skilllens scan [path] [--auditor claude|codex]
skilllens config
```

`scan` uses `scan.autoRoots` from the config by default. Pass a path to scan a specific directory instead.
Scan output includes auditor CLI availability for `claude` and `codex`

## First-run setup (scan)

`skilllens scan` creates a global config on first run:

- User config: `~/.skilllens/config.json`

The config includes:

- `auditor` (defaults to the first available CLI)
- `scan.autoRoots` (default skill locations)

Default scan roots:

- `~/.claude/skills`
- `~/.opencode/skills`
- `~/.codex/skills`

SkillLens also seeds `.codex/skills/.system` plus common XDG config/data locations; adjust `scan.autoRoots` as needed.

To view the current config and its path:

```bash
skilllens config
```

Edit `auditor` or `scan.autoRoots` in the config file to change the CLI tool or add skill paths.

## Notes

- The v0.1 implementation focuses on packaging and scan output. Auditor calls and deep scanning are stubbed and will evolve.
- SkillLens uses auditor CLIs (no direct API calls). Install and login to `claude` or `codex`.
- Missing auditor CLIs still produce scan results with audit status `skipped`.

## Development

```bash
npm run lint
npm run smoke
```
