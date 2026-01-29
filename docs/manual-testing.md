---
summary: 'Copy/paste CLI smoke checklist for local verification.'
read_when:
  - Pre-merge validation
  - Reproducing a reported CLI bug
---

# Manual testing (CLI)

## Setup
- Ensure logged in: `bun skills whoami` (or `bun skills login`).
- Optional: set env
  - `SKILLS_SITE=https://skills.com`
  - `SKILLS_REGISTRY=https://skills.com`

## Smoke
- `bun skills --help`
- `bun skills --cli-version`
- `bun skills whoami`

## Search
- `bun skills search gif --limit 5`

## Install / list / update
- `mkdir -p /tmp/skills-manual && cd /tmp/skills-manual`
- `bunx skills@beta install gifgrep --force`
- `bunx skills@beta list`
- `bunx skills@beta update gifgrep --force`

## Publish (changelog optional)
- `mkdir -p /tmp/skills-skill-demo/SKILL && cd /tmp/skills-skill-demo`
- Create files:
  - `SKILL.md`
  - `notes.md`
- Publish:
  - `bun skills publish . --slug skills-manual-<ts> --name "Manual <ts>" --version 1.0.0 --tags latest`
- Publish update with empty changelog:
  - `bun skills publish . --slug skills-manual-<ts> --name "Manual <ts>" --version 1.0.1 --tags latest`

## Delete / undelete (owner/admin)
- `bun skills delete skills-manual-<ts> --yes`
- Verify hidden:
- `curl -i "https://skills.com/api/v1/skills/skills-manual-<ts>"`
- Restore:
  - `bun skills undelete skills-manual-<ts> --yes`
- Cleanup:
  - `bun skills delete skills-manual-<ts> --yes`

## Sync
- `bun skills sync --dry-run --all`

## Playwright (menu smoke)

Run against prod:

```
PLAYWRIGHT_BASE_URL=https://skills.com bun run test:pw
```

Run against a local preview server:

```
bun run test:e2e:local
```
