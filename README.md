# mojo-skills

Agent skills by Pat Madhavaram ("Mojo"). They are tool-neutral: each skill is a folder with a `SKILL.md` and the files it needs, so they work in Claude Code, Codex, GitHub Copilot, Gemini CLI, Cursor and any other agent that reads skills.

| Skill | What it does |
|---|---|
| [review-pane](skills/review-pane/SKILL.md) | A floating review overlay for HTML prototypes. The reviewer steps through the asks, approves ✓ or rejects ✕ each change with a note, and saves a copy with the marks. The skill also holds the routine for running review rounds from that saved copy. |

## Install

Pick your tool. Each command installs every skill in this repo.

**Claude Code**

```
/plugin marketplace add pat-madhav/mojo-skills
/plugin install mojo-skills@mojo
```

**Codex**

```
codex plugin marketplace add pat-madhav/mojo-skills
codex plugin add mojo-skills@mojo
```

**GitHub Copilot (CLI)**

```
copilot plugin marketplace add pat-madhav/mojo-skills
copilot plugin install mojo-skills@mojo
```

**Gemini CLI**

```
gemini skills install https://github.com/pat-madhav/mojo-skills.git --path skills
```

**Cursor, Windsurf, opencode, Amp and other agents** (copies the skill files into your project, so you can edit them)

```
npx skills@latest add pat-madhav/mojo-skills -a cursor
```

Change `-a cursor` to your agent, or leave `-a` out to choose from a list.

## Update

| Tool | Update |
|---|---|
| Claude Code | `/plugin marketplace update mojo`, or turn on auto-update for the `mojo` marketplace in `/plugin` |
| Codex, Copilot | The plugin updates when the tool starts. |
| Gemini CLI | Run the install command again. |
| Other agents | `npx skills@latest update` |

## Using rvx.js on a page

`skills/review-pane/rvx.js` is the single source of the review pane. Pages load it; they never hold a copy. Every release is tagged (`v1.0.0`, `v1.1.0` …) and published to npm, so jsDelivr serves it:

```html
<!-- stay on one release -->
<script id="rvx-js" src="https://cdn.jsdelivr.net/npm/mojo-skills@1.1.0/skills/review-pane/rvx.js"></script>

<!-- follow the latest 1.x release -->
<script id="rvx-js" src="https://cdn.jsdelivr.net/npm/mojo-skills@1/skills/review-pane/rvx.js"></script>
```

GitHub Pages serves the same files at `https://pat-madhav.github.io/mojo-skills/review-pane/rvx.js` (latest), `…/review-pane/v1/rvx.js` (latest 1.x) and `…/review-pane/v1.1.0/rvx.js` (fixed). claude.ai artifact pages may only load scripts from npm CDNs, so use the jsDelivr address there.

The page also needs its asks and a place for the marks. See [the review-pane skill](skills/review-pane/SKILL.md).

## Releasing

1. Change the skill. For rvx.js, bump the version in its first line and in `window.rvx.version`.
2. Set the same version in `package.json` and `.claude-plugin/plugin.json`, and add a `CHANGELOG.md` entry.
3. Tag and push: `git tag v1.2.0 && git push origin v1.2.0`.

The release workflow checks that the versions match, loads the pane in a headless browser (light, dark and 390px phone width), and publishes only if that passes: npm (for jsDelivr), a GitHub release and GitHub Pages.

Run the browser check locally with `npm install && npx playwright install chromium && npm test`.

## Licence

MIT
