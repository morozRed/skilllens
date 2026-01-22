# PRD Update: SkillLens — Scan-led setup (no `init`)

## 1) Summary

**SkillLens** is a developer CLI that scans locally installed agent “skills/tools”, extracts redacted security evidence, sends it to an online auditor (**Claude**, **Codex**, or **OpenCode**) via their CLI for classification, and outputs a human-friendly overview. The primary workflow is `skilllens scan`, which also handles first-time config creation.

## 2) Key UX principle

**One command to start:** `skilllens scan`
If this is the first run, `scan` automatically creates config and then runs.

---

## 3) CLI commands (v1)

### Core

* `skilllens scan [path]`

  * First-time run:

    * creates config if missing
    * validates auditor CLI availability
    * scans and outputs findings to stdout
  * Subsequent runs:

    * uses existing config
    * runs scan + audit (if CLI available)

### Configuration utility

* `skilllens config`

> Removal: `skilllens init` does not exist.

---

## 4) First-run setup behavior (detailed)

### 4.1 When setup triggers

On `skilllens scan`:

* If **no user config**:

  * trigger setup

### 4.2 What setup creates

Create:

1. **User config** at `~/.skilllens/config.json` (global defaults)

### 4.3 Setup content

Default `~/.skilllens/config.json` should include:

* `auditor` default: `"claude"` (or your preference)
* `scan.autoRoots` seeded with common skill locations (e.g., `~/.claude/skills`, `~/.opencode/skills`, `~/.codex/skills`, plus XDG locations)
* safe redaction + upload caps
* cache enabled

Setup must print:

* file paths created
* which auditor is selected
* which CLI is required (e.g., `claude`)
* reminder to log in via that CLI
* how to switch auditors (edit config or pass `--auditor codex`)
* what will be uploaded (high-level)

### 4.4 Missing auditor CLI behavior

If selected auditor CLI is missing or not authenticated:

* **Do not scan silently.**
* Options:

  * If `--no-audit` existed, you could still do local extraction-only, but you’ve said “online only for now”.
  * So v1 should:

    * still perform **local discovery + extraction**
    * print “Audit skipped: auditor CLI not available”
    * exit non-zero (or print actionable next steps) — choose one policy and document it.

Recommended:

* Print audit-skipped status + exit code `2` (distinguish from “found malicious”).
* This still gives value and avoids “tool did nothing”.

---

## 5) Config system (unchanged, but no init)

### Precedence

CLI flags > user config > defaults

### Paths

* User: `~/.skilllens/config.json`
Only global config is supported in v1.

---

## 6) Everything else remains the same

Scanning, evidence packs, redaction, auditors (Claude/Codex/OpenCode), caching — unchanged.

---

## Recommendation

Do it this way. It reduces cognitive load:

* no “do I run init first?”
* no documentation tax
* better first impression: one command works

If you want one extra polish: after setup, print a **single copy-pastable command**:

* `claude login` (or whichever auditor)
* then: `skilllens scan`

And optionally mention `skilllens config show` for debugging.

If you want, I can now produce the **final PRD text** as a single clean document (not a diff) with `init` removed and onboarding behavior fully specified.
