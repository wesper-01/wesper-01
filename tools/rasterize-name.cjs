// Rasterize a word in a real typeface to a 0/1 grid (writes tools/name-grid.json). Needs Playwright.
// Run: node tools/rasterize-name.cjs Rayane tools/fonts/albert-sans-latin-600-normal.woff2 22 > tools/name-grid.json
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [word, fontFile, rows] = [process.argv[2], process.argv[3], +process.argv[4]];
  const b64 = fs.readFileSync(fontFile).toString('base64');
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${b64})}</style><span style="font-family:F">x</span>`);
  await p.evaluate(() => document.fonts.ready);
  const grid = await p.evaluate(({ word, rows }) => {
    const H = 400, c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = `${H}px F`; const w = Math.ceil(g.measureText(word).width) + 20;
    c.width = w; c.height = Math.ceil(H * 1.0); g.font = `${H}px F`; g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
    g.fillText(word, 10, H * 0.78);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    // tight bbox
    let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const bh = y1 - y0 + 1, bw = x1 - x0 + 1, cell = bh / rows, cols = Math.round(bw / cell), out = [];
    for (let r = 0; r < rows; r++) { let s = ''; for (let q = 0; q < cols; q++) {
      let on = 0, n = 0; for (let yy = 0; yy < cell; yy += cell / 4) for (let xx = 0; xx < cell; xx += cell / 4) { n++; const X = Math.floor(x0 + q * cell + xx), Y = Math.floor(y0 + r * cell + yy); if (d[(Y * c.width + X) * 4 + 3] > 128) on++; }
      s += on / n > 0.5 ? '1' : '0'; } out.push(s); }
    return out;
  }, { word, rows });
  console.log(JSON.stringify(grid)); await b.close();
})();
