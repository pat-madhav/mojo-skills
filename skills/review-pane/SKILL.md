---
name: review-pane
description: Add a floating review pane to an HTML prototype so the reviewer can approve or reject each change with notes, then run review rounds from their saved copy. Use when publishing an HTML page for design review, or when the user sends back a saved "with-feedback" copy.
---

# Review pane

The review pane (rvx) floats over an HTML page under review. It walks the reviewer through a list of asks, highlights each change on the page, and lets them mark it ✓ approved or ✕ not right yet, with a note. **Save copy** writes the marks into a copy of the page; **Copy feedback** puts them on the clipboard as text.

The code lives in one file, `rvx.js`, next to this SKILL.md. Never paste a copy of it into a page. Load it from the CDN.

## Load the pane on a page

Put these three tags at the end of the page's `<body>`:

```html
<script type="application/json" id="rv-data">[
  {"n":1,"ask":"Short summary of the ask","changed":"What changed, in a sentence or two","go":"#css-selector-of-the-change"}
]</script>
<script type="application/json" id="rv-state">{}</script>
<script id="rvx-js" src="https://cdn.jsdelivr.net/npm/mojo-skills@1.2.0/skills/review-pane/rvx.js"
  data-title="Page name" data-key="page-name-rvx-v1"></script>
```

Pick the address by how the page should follow releases:

| Address | Loads |
|---|---|
| `…/npm/mojo-skills@1.2.0/skills/review-pane/rvx.js` | exactly v1.2.0, never changes (default for published pages) |
| `…/npm/mojo-skills@1/skills/review-pane/rvx.js` | the latest 1.x release |
| `https://pat-madhav.github.io/mojo-skills/review-pane/rvx.js` | the latest release, for pages opened outside claude.ai |

claude.ai artifact pages may only load scripts from npm CDNs, so use the jsDelivr `/npm/` address there. GitHub Pages addresses are blocked on claude.ai.

### Options on the `rvx-js` tag

| Attribute | Use |
|---|---|
| `data-title` | Name shown in the pane and the feedback text. Defaults to the page title. |
| `data-key` | Browser storage key for the marks. Change it each round so old marks don't leak in. |
| `data-occlude` | Selector for sticky headers that cover the top of the page. |
| `data-avoid` | Selector for fixed bars at the bottom that the pane should stay above. |
| `data-strip` | Selector for runtime-only nodes to drop from saved copies. |
| `data-file` | File name for Save copy. Defaults to `<title>_with-feedback.html`. |

Override colours with the `--rvx-*` CSS variables if a page needs it.

### Writing asks

- `n`: the ask number. Number a fresh round from 1.
- `ask`: one line, in the reviewer's words where possible.
- `changed`: what is different now and where to look. Plain sentences.
- `go`: a CSS selector for the element that shows the change. The pane highlights it, scrolls to it, draws a line to it and keeps clear of it. Leave `go` out for asks with nothing to point at.

## The round routine

Run this each time the reviewer sends back a saved copy (usually named `…_with-feedback.html`).

1. **Read the marks from the saved copy.** Parse the JSON in its `<script id="rv-state">` tag. Each key is an ask number with `{"s":"ok"}` (approved), `{"s":"no","note":"…"}` (not right yet) or no entry (not checked). Keys starting with `_` (`_cur`, `_pos`, `_hidden`) are pane settings: ignore them. Read the asks from the saved copy's `rv-data` too, so you know what each number meant.
2. **Drop approved asks.** They are done and leave the list.
3. **Act on the rest.** For each ✕ ask, fix what the note says and rewrite `changed` to describe the new state. Keep unchecked asks as they are.
4. **Add new asks** for anything else the reviewer asked for this round.
5. **Renumber from 1**, reset `rv-state` to `{}`, and change `data-key` (for example bump `-v3` to `-v4`) so the reviewer starts clean.
6. **Check** the page in a browser at desktop and phone width, light and dark. Step through every ask: the highlight lands on the right element, and the pane doesn't cover it.
7. **Publish** the page, then tell the reviewer how many asks were approved and dropped, which ones carried over, and what is new.

Work on the source page, never on the saved copy: the saved copy is a snapshot taken in the reviewer's browser.

## Updating rvx.js itself

Edit `skills/review-pane/rvx.js` in the mojo-skills repo, bump the version in its first line, `window.rvx.version` and `package.json`, add a CHANGELOG entry, and tag the release (`vX.Y.Z`). The release workflow tests the pane in a headless browser and publishes the package; pages pinned to the old version keep it until you change their address.
