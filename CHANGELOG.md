# Changelog

## review-pane 1.2.0

- Drag anywhere: the summary pill now goes to within 6px of any screen edge, including over a sticky header. Only the top row and the pill have to stay on screen; the details card no longer limits where the pane can go.
- A pane the reviewer has placed stays put. It no longer glides aside by itself; double-click the pill to let it follow the changes again.
- The details card opens above the pill when there is no room below.
- The connecting line is a smooth curve in the pane's blue, violet and pink, and starts from the edge of the details card when the card is open.
- Click the pill to go back to the change after scrolling away. While the change is off screen the pill shows a "Go back to the change" tag.
- An ask with nothing to point at shows a "Nothing to highlight" tag and a line in the details card.
- Fixed: the details card's shadow was cut off in a straight line, leaving a square haze around the card.
- Removed the browser tooltip on the pill, which covered the details card. The hint is now an `aria-description`.

## review-pane 1.1.0

- The pane gets out of the way: when it or its details card covers the highlighted change, it glides to the nearest clear space. The line to the change stays attached during the glide. If the pane slides out from under the pointer while showing details, the details stay open until the pointer heads away.
- Layout: the ‹ n/N › arrows, Save copy and the list sit on the left; the ✓ and ✕ tiles sit on the right.
- Colours: ✓ rests light green and turns dark green when chosen; ✕ rests light red and turns dark red with a red glow when chosen. Both look the same in light and dark themes (override with `--rvx-yes*` and `--rvx-nay*`).
- `window.rvx.version` reports the loaded version.

## review-pane 1.0.0

- First release: approve/reject tiles, draggable summary pill with a details card, highlight and connecting line, list of asks with Copy feedback, Save copy with marks, keyboard `[` and `]`.
