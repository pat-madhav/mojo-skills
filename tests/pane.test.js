// Release check for skills/review-pane/rvx.js. Drives the review pane in Chromium: light, dark and 390px phone width.
// For each theme/size: steps through every ask, opens the details card, and checks the pane
// never covers the highlighted change; drags the pane by hand (it must stay where it is put, reach the corners
// and open its details upward at the bottom edge); clicks the pill to return to a change; checks tile colours.
const { chromium } = require('playwright');
const path = require('path');
const page_url = 'file://' + path.resolve(process.argv[2] || path.join(__dirname, 'fixture.html'));
const out = process.argv[3] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });

const ovl = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? Math.round(w * h) : 0; };

(async () => {
  const browser = await chromium.launch();
  const runs = [
    { name: 'light', scheme: 'light', viewport: { width: 1440, height: 900 } },
    { name: 'dark', scheme: 'dark', viewport: { width: 1440, height: 900 } },
    { name: 'phone', scheme: 'light', viewport: { width: 390, height: 844 }, mobile: true },
  ];
  const report = {};
  let fails = 0;
  for (const run of runs) {
    const ctx = await browser.newContext({ viewport: run.viewport, colorScheme: run.scheme, deviceScaleFactor: 1, hasTouch: !!run.mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(page_url);
    await page.waitForSelector('.rvx', { timeout: 10000 });
    await page.waitForTimeout(700);
    const R = report[run.name] = { errors, version: await page.evaluate(() => window.rvx && window.rvx.version), asks: [] };
    // v1.0.0 predates the get-out-of-the-way and colour rules, so it gets the smoke checks only
    const modern = !!R.version;
    const fail = () => { if (modern) fails++; };
    // 1.2.0: a pane placed by hand stays put, reaches the corners, and the pill returns to the change
    const placed = modern && R.version.localeCompare('1.2.0', undefined, { numeric: true }) >= 0;

    // layout: arrows left, decision tiles right
    R.order = await page.evaluate(() => [...document.querySelectorAll('.rvx-acts > *')].map(e => e.className.replace('rvx-g', '').replace(/\s+/g, ' ').trim()));
    const n = await page.evaluate(() => JSON.parse(document.getElementById('rv-data').textContent).length);

    const measure = async () => page.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; };
      const P = document.querySelector('.rvx'), hl = document.querySelector('.rvx-hl'), ln = document.querySelector('.rvx-ln path') || document.querySelector('.rvx-ln line');
      const det = document.querySelector('.rvx-det');
      return { pane: r(P), det: P.classList.contains('open') ? r(det) : null, hl: hl.classList.contains('on') ? r(hl) : null,
        line: document.querySelector('.rvx-ln').classList.contains('on') ? { d: ln.getAttribute('d') || [ln.getAttribute('x1'), ln.getAttribute('y1'), ln.getAttribute('x2'), ln.getAttribute('y2')].join(' ') } : null,
        sum: r(document.querySelector('.rvx-sum')), open: P.classList.contains('open'), pos: document.querySelector('.rvx-pos').textContent };
    });

    for (let i = 0; i < n; i++) {
      if (i) { if (run.mobile) await page.tap('.rvx-nav [data-d="1"]'); else await page.click('.rvx-nav [data-d="1"]'); }
      await page.waitForTimeout(1300);
      const closed = await measure();
      // open the details: hover the pill (mouse) or tap it (touch)
      if (run.mobile) await page.tap('.rvx-sum'); else await page.hover('.rvx-sum');
      await page.waitForTimeout(1100);
      const open = await measure();
      const covered = open.hl ? ovl(open.pane, open.hl) : 0;
      const hlArea = open.hl ? (open.hl.right - open.hl.left) * (open.hl.bottom - open.hl.top) : 0;
      const vpArea = run.viewport.width * run.viewport.height;
      const inPane = await page.evaluate(() => { const it = JSON.parse(document.getElementById('rv-data').textContent)[+document.querySelector('.rvx-pos').textContent.split(' ')[0] - 1]; const t = it.go && document.querySelector(it.go); return !!(t && document.querySelector('.rvx').contains(t)); });
      const big = hlArea > vpArea * 0.5 || inPane; // a target larger than half the screen cannot be fully cleared
      R.asks.push({ ask: closed.pos, inPane, onScreen: !!(open.hl && open.hl.left >= 0 && open.hl.right <= run.viewport.width), coveredClosed: closed.hl ? ovl(closed.pane, closed.hl) : 0, coveredOpen: covered, stillOpen: open.open, big, line: !!open.line });
      if (covered && !big) fail();
      if (!open.open) fails++;
      await page.screenshot({ path: `${out}/${run.name}-ask${i + 1}.png` });
      await page.mouse.move(5, run.viewport.height - 5);
      if (run.mobile) await page.tap('.rvx-sum');
      await page.waitForTimeout(500);
    }

    // force an overlap: go to ask 1, drag the pill onto the change, release, sample the glide
    await page.evaluate(() => { const b = document.querySelector('.rvx-nav [data-d="-1"]'); });
    await page.keyboard.press('Escape');
    const want = R.asks.findIndex(a => !a.big && a.onScreen) + 1;
    for (let k = 0; k < n; k++) { const p = await page.textContent('.rvx-pos'); if (p.startsWith(want + ' /')) break; await page.click('.rvx-nav [data-d="1"]'); await page.waitForTimeout(300); }
    await page.waitForTimeout(1300);
    const before = await measure();
    if (before.hl) {
      const s = before.sum, h = before.hl;
      const from = { x: (s.left + s.right) / 2, y: (s.top + s.bottom) / 2 }, to = { x: (h.left + h.right) / 2, y: (h.top + h.bottom) / 2 };
      await page.mouse.move(from.x, from.y); await page.mouse.down();
      for (let k = 1; k <= 10; k++) await page.mouse.move(from.x + (to.x - from.x) * k / 10, from.y + (to.y - from.y) * k / 10);
      const dropped = await measure();
      await page.mouse.up();
      const trail = [];
      for (let k = 0; k < 12; k++) { await page.waitForTimeout(50); const m = await page.evaluate(() => { const b = document.querySelector('.rvx').getBoundingClientRect(); const ln = document.querySelector('.rvx-ln'); return { x: Math.round(b.left), y: Math.round(b.top), line: ln.classList.contains('on') }; }); trail.push(m); }
      const after = await measure();
      const steps = trail.map((t, k) => k ? Math.hypot(t.x - trail[k - 1].x, t.y - trail[k - 1].y) : 0);
      R.drag = { ask: want, coveredOnDrop: ovl(dropped.pane, dropped.hl), coveredAfter: ovl(after.pane, after.hl), framesMoving: steps.filter(d => d > 0.5).length, biggestStep: Math.round(Math.max(...steps)), lineAfter: !!after.line };
      if (placed) {
        if (R.drag.framesMoving) fail(); // a pane the reviewer placed must not move by itself
      } else {
        if (R.drag.coveredAfter) fail();
        if (R.drag.framesMoving < 3) fail(); // a jump moves in one frame; a glide spreads over several
      }
      await page.screenshot({ path: `${out}/${run.name}-after-drag.png` });
      if (placed && !run.mobile) {
        const W = run.viewport.width, Hh = run.viewport.height;
        const dragTo = async (x, y) => { const m = await measure(); await page.mouse.move((m.sum.left + m.sum.right) / 2, (m.sum.top + m.sum.bottom) / 2); await page.mouse.down(); await page.mouse.move(x, y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(700); return measure(); };
        // corners: the pill reaches within 8px of the edges, and the top row stays on screen
        const tl = await dragTo(-400, -400), br = await dragTo(W + 400, Hh + 400);
        await page.mouse.move(br.sum.left + 40, br.sum.top + 10); await page.waitForTimeout(900);
        const brOpen = await measure();
        R.corners = { topLeft: [Math.round(tl.sum.left), Math.round(tl.pane.top)], bottomRight: [Math.round(W - br.sum.right), Math.round(Hh - br.sum.bottom)], detailsAbove: !!(brOpen.det && brOpen.det.bottom <= brOpen.sum.top && brOpen.det.top >= 0) };
        if (tl.sum.left > 8 || tl.pane.top > 8 || tl.pane.top < 0) fail();
        if (W - br.sum.right > 8 || Hh - br.sum.bottom > 8 || br.sum.bottom > Hh) fail();
        if (!R.corners.detailsAbove) fail();
        await page.screenshot({ path: `${out}/${run.name}-corner.png` });
        await page.mouse.move(5, 5); await page.waitForTimeout(500);
        // scroll away, then click the pill: the page returns to the change
        await dragTo(W - 260, Hh / 2);
        await page.evaluate(() => scrollBy(0, 4000)); await page.waitForTimeout(600);
        const away = await page.evaluate(() => ({ t: document.querySelector('.rvx').dataset.t, tag: document.querySelector('.rvx-tag').textContent }));
        const s2 = (await measure()).sum; await page.mouse.click(s2.left + 60, (s2.top + s2.bottom) / 2); await page.waitForTimeout(1400);
        const back = await page.evaluate(() => ({ t: document.querySelector('.rvx').dataset.t, hl: document.querySelector('.rvx-hl').classList.contains('on') }));
        R.goBack = { away, back };
        if (away.t === 'away' && (back.t !== 'on' || !back.hl)) fail();
        if (away.t === 'away' && !away.tag) fail();
      }
      await page.dblclick('.rvx-sum'); await page.waitForTimeout(900);
      if (placed) { const f = await measure(); R.followAgain = { covered: f.hl ? ovl(f.pane, f.hl) : 0 }; }
    }

    // tile colours at rest and chosen
    const col = () => page.evaluate(() => ['.rvx-t.ok', '.rvx-t.no'].map(s => { const c = getComputedStyle(document.querySelector(s)); return { bg: c.backgroundColor, fg: c.color, glow: c.boxShadow.includes('232, 40, 48') }; }));
    R.tilesRest = await col();
    await page.click('.rvx-t.ok'); await page.waitForTimeout(250);
    R.okChosen = (await col())[0];
    await page.screenshot({ path: `${out}/${run.name}-ok-chosen.png`, clip: await page.evaluate(() => { const b = document.querySelector('.rvx-acts').getBoundingClientRect(); return { x: b.left - 10, y: b.top - 10, width: b.width + 20, height: b.height + 20 }; }) });
    await page.waitForTimeout(700);
    await page.click('.rvx-t.no'); await page.waitForTimeout(400);
    R.noChosen = (await col())[1];
    // layout and colour rules: arrows first, ✕ last; ✕ glows red when chosen; tiles differ at rest and chosen
    if (R.order[0] !== 'rvx-nav' || !/\bno\b/.test(R.order[R.order.length - 1])) fail();
    if (!R.noChosen.glow || R.tilesRest[0].bg === R.okChosen.bg || R.tilesRest[1].bg === R.noChosen.bg) fail();
    await page.screenshot({ path: `${out}/${run.name}-no-chosen.png`, clip: await page.evaluate(() => { const b = document.querySelector('.rvx-acts').getBoundingClientRect(); return { x: b.left - 24, y: b.top - 24, width: b.width + 48, height: b.height + 48 }; }) });
    await page.screenshot({ path: `${out}/${run.name}-full.png` });
    if (errors.length) fails++;
    if (!R.asks.length || R.asks.length !== n) fails++;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 1));
  console.log(fails ? `FAIL (${fails})` : 'PASS');
  process.exit(fails ? 1 : 0);
})();
