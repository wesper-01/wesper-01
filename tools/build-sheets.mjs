// Builds the README header in assets/ from DESIGN.md, in a light and a dark version: the handle as a
// 3D ASCII render (tools/ascii3d.mjs over tools/name-grid.json) that decodes out of binary once, then holds.
// Run: node tools/build-sheets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scene, frame } from './ascii3d.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
fs.mkdirSync(OUT, { recursive: true });
for (const old of fs.readdirSync(OUT)) if (old.endsWith('.svg')) fs.unlinkSync(path.join(OUT, old));

// Tokens come from DESIGN.md, nowhere else: the :root block is light, [data-theme="dark"] is dark.
const design = fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8');
const block = sel => design.match(new RegExp(sel.replace(/[[\]"=]/g, '\\$&') + '\\s*\\{([^}]*)\\}'))[1];
const read = css => {
  const t = {};
  for (const [, k, v] of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6}|oklch\([^)]*\))/gi)) {
    const m = v.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
    t[k] = m ? hex(+m[1] / 100, +m[2], +m[3]) : v;
  }
  return t;
};
const THEMES = { light: read(block(':root')), dark: read(block('[data-theme="dark"]')) };

function hex(L, C, h) {
  const r = h * Math.PI / 180, A = C * Math.cos(r), B = C * Math.sin(r);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return '#' + [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('');
}

const f = n => fs.readFileSync(path.join(ROOT, 'tools/fonts', n)).toString('base64');
const face = (fam, w, file) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${f(file)}) format("woff2")}`;
const MONO = face('JetBrains Mono', 400, 'jetbrains-mono-latin-400-normal.woff2');

// The render: the handle, extruded and ray-traced into characters, at a slight fixed angle. On load it
// shows as a silhouette of bits, decodes left to right into its shaded characters once, and stays.
const R = { cols: 150, rows: 27, depth: 7, yaw: 0.24, pitch: -0.2, sx: 0.66, light: [-0.3, 0.5, -0.85],
  decodeAt: 0.25, decodeFor: 1.2, step: 0.06 };
const NAME = scene(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/name-grid.json'), 'utf8')), R.depth);
const FINAL = frame(NAME, R.cols, R.rows, R.yaw, R.pitch, R.sx, R.sx * 1.7, R.light);
const BITS = [...Buffer.from('wesper', 'ascii')].flatMap(b => [...b.toString(2).padStart(8, '0')]);
let rs = 0x51ee;
const jitter = FINAL.map(l => [...l.padEnd(R.cols)].map(() => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)));
const lockAt = (r, c) => R.decodeAt + R.decodeFor * (0.82 * c / R.cols + 0.18 * jitter[r][c]);
const END = R.decodeAt + R.decodeFor + R.step;
const TIMES = [[0, R.decodeAt]];
for (let t = R.decodeAt; t < END - 1e-9; t += R.step) TIMES.push([t, Math.min(t + R.step, END)]);
const FRAMES = TIMES.map(([t0, t1], n) => ({ t0, t1, last: t1 >= END - 1e-9,
  lines: FINAL.map((l, r) => [...l.padEnd(R.cols)].map((ch, c) => ch === ' ' ? ' ' : t0 >= lockAt(r, c) ? ch : BITS[(r * 7 + c * 3 + n) % BITS.length]).join('').replace(/\s+$/, '')) }));

const W = 960, FS = W / R.cols / 0.6, LH = FS * 1.02, H = Math.round(R.rows * LH + 12);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pct = t => (100 * t / END).toFixed(2);
const svg = t => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="wesper">
<title>wesper</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.ink}}
.bit{fill:${t.muted}}
.f{opacity:0;animation-duration:${END}s;animation-timing-function:step-end;animation-fill-mode:forwards}
${FRAMES.map(({ t0, t1, last }, i) => `@keyframes f${i}{0%{opacity:0}${pct(t0)}%{opacity:1}${last ? '' : `${pct(t1)}%,`}100%{opacity:${last ? 1 : 0}}}`).join('\n')}
@media (prefers-reduced-motion: reduce){.f{animation:none!important;opacity:0}.f.last{opacity:1}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${FRAMES.map(({ lines, last }, i) => `<text class="f${last ? ' last' : ''}" font-size="${FS.toFixed(2)}" style="animation-name:f${i}">${lines.map((l, j) => `<tspan x="0" y="${(6 + (j + 0.8) * LH).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`).join('\n')}
</svg>`;

for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `header-${mode}.svg`), svg(t));
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
