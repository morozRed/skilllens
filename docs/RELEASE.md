# SkillGuard Release Checklist

## Files to verify in package

- `package.json` (name, version, bin, files)
- `bin/skillguard.js` (shebang + entrypoint)
- `src/` (CLI sources)
- `README.md` (usage)
- `LICENSE`

## Preflight

- `node --check bin/skillguard.js`
- `node --check src/cli.js`
- `npm pack` (inspect tarball contents)

## Publish to npm

- `npm login`
- `npm version <patch|minor|major>`
- `npm publish --access public`

## Verify install flows

- `npx skillguard --help`
- `pnpm dlx skillguard --help`
- `bunx skillguard --help`

## Global install

- `npm i -g skillguard`
- `pnpm add -g skillguard`
- `bun add -g skillguard`
