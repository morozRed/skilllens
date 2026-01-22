# SkillLens Release Checklist

## Files to verify in package

- `package.json` (name, version, bin, files)
- `bin/skilllens.js` (shebang + entrypoint)
- `src/` (CLI sources)
- `README.md` (usage)
- `LICENSE`

## Preflight

- `node --check bin/skilllens.js`
- `node --check src/cli.js`
- `npm pack` (inspect tarball contents)

## Publish to npm

- `npm login`
- `npm version <patch|minor|major>`
- `npm publish --access public`

## Verify install flows

- `npx skilllens --help`
- `pnpm dlx skilllens --help`
- `bunx skilllens --help`

## Global install

- `npm i -g skilllens`
- `pnpm add -g skilllens`
- `bun add -g skilllens`
