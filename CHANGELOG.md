# Changelog

## review-pane 1.1.0

- The pane gets out of the way: when it or its details card covers the highlighted change, it glides to the nearest clear space. The line to the change stays attached during the glide. If the pane slides out from under the pointer while showing details, the details stay open until the pointer heads away.
- Layout: the ‹ n/N › arrows, Save copy and the list sit on the left; the ✓ and ✕ tiles sit on the right.
- Colours: ✓ rests light green and turns dark green when chosen; ✕ rests light red and turns dark red with a red glow when chosen. Both look the same in light and dark themes (override with `--rvx-yes*` and `--rvx-nay*`).
- `window.rvx.version` reports the loaded version.

## review-pane 1.0.0

- First release: approve/reject tiles, draggable summary pill with a details card, highlight and connecting line, list of asks with Copy feedback, Save copy with marks, keyboard `[` and `]`.
