#!/usr/bin/env bash
# Builds the GitHub Pages site: every released rvx.js at a fixed address.
#   review-pane/rvx.js          latest release
#   review-pane/v1/rvx.js       latest 1.x
#   review-pane/v1.1.0/rvx.js   exactly that release
set -euo pipefail
out="${1:-_site}"
rm -rf "$out"; mkdir -p "$out/review-pane"
tags=$(git tag --list 'v*.*.*' --sort=v:refname)
[ -n "$tags" ] || { echo "no release tags"; exit 1; }
rows=""
for t in $tags; do
  if git cat-file -e "$t:skills/review-pane/rvx.js" 2>/dev/null; then
    mkdir -p "$out/review-pane/$t"
    git show "$t:skills/review-pane/rvx.js" > "$out/review-pane/$t/rvx.js"
    major="${t%%.*}"; mkdir -p "$out/review-pane/$major"
    cp "$out/review-pane/$t/rvx.js" "$out/review-pane/$major/rvx.js"   # tags are sorted, so the last one wins
    cp "$out/review-pane/$t/rvx.js" "$out/review-pane/rvx.js"
    rows="<li><a href=\"review-pane/$t/rvx.js\">review-pane/$t/rvx.js</a></li>$rows"
  fi
done
cat > "$out/index.html" <<HTML
<!doctype html><meta charset="utf-8"><title>mojo-skills</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:65ch;margin:40px auto;padding:0 16px}code{font-size:13px}</style>
<h1>mojo-skills</h1>
<p>Released files from <a href="https://github.com/${GITHUB_REPOSITORY:-pat-madhav/mojo-skills}">the repo</a>. On claude.ai pages, load from jsDelivr's npm address instead: <code>https://cdn.jsdelivr.net/npm/mojo-skills@1/skills/review-pane/rvx.js</code>.</p>
<ul><li><a href="review-pane/rvx.js">review-pane/rvx.js</a> (latest)</li>$rows</ul>
HTML
find "$out" -type f | sort
