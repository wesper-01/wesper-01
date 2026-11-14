// Builds the README header in assets/ from DESIGN.md, in a light and a dark version: the handle as a
// 3D ASCII render (tools/ascii3d.mjs over tools/name-grid.json) over a slow ASCII aurora.
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

// The render: the handle, extruded and ray-traced into characters, at a slight fixed angle. It never moves.
const R = { cols: 150, rows: 27, depth: 7, yaw: 0.24, pitch: -0.2, sx: 0.66 };
const NAME = scene(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/name-grid.json'), 'utf8')), R.depth);
const FINAL = frame(NAME, R.cols, R.rows, R.yaw, R.pitch, R.sx, R.sx * 1.7, [-0.28, 0.5, -0.85]);

// the aurora: behind the still name, two curtains of light drift sideways and breathe. Each is a band
// that wanders up and down along its length, sharp at its lower edge and fading upward, combed into
// vertical rays. Only empty cells take it, with a one-cell gap around the letters, so the name stays solid.
const A = { top: 5, loop: 16, frames: 32, ramp: ' ..::-=+*' };
const ROWS = R.rows + A.top;
const NAMEROWS = [...Array(A.top).fill(''), ...FINAL].map(l => l.padEnd(R.cols));
const solid = (r, c) => (NAMEROWS[r] || '')[c] > ' ';
const near = (r, c) => solid(r, c) || solid(r, c - 1) || solid(r, c + 1) || solid(r - 1, c) || solid(r + 1, c);
const TAU = 2 * Math.PI;
const curtain = (c, r, p, o) => {
  const y = o.y + o.a * Math.sin(c * o.k + p * o.w + o.ph) + o.b * Math.sin(c * o.k * 2.3 - p * o.w2 + o.ph * 2);
  const d = y - r, band = d < 0 ? Math.exp(-(d * d) / 1.2) : Math.exp(-d / o.tail);
  const rays = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(c * 1.3 + 3 * Math.sin(c * 0.09 + p * o.w + o.ph))) ** 1.3;
  const swell = 0.5 + 0.5 * Math.sin(c * 0.05 - p * o.w2 + o.ph);
  return Math.max(0, band * rays * (0.35 + 0.65 * swell) * o.gain - 0.06) * 1.3;
};
const CURTAINS = [
  { y: 10, a: 2.6, b: 1.3, k: 0.045, w: 1, w2: 2, ph: 0.4, tail: 5.5, gain: 1.25 },
  { y: 31, a: 2.2, b: 1.1, k: 0.06, w: -1, w2: 1, ph: 2.1, tail: 4.5, gain: 1.1 },
];
const AURORA = [];
for (let n = 0; n < A.frames; n++) {
  const p = TAU * n / A.frames;
  AURORA.push(Array.from({ length: ROWS }, (_, r) => { let s = '';
    for (let c = 0; c < R.cols; c++) {
      const v = near(r, c) ? 0 : Math.min(1, CURTAINS.reduce((m, o) => m + curtain(c, r, p, o), 0));
      s += A.ramp[Math.round(v * (A.ramp.length - 1))];
    }
    return s.replace(/\s+$/, ''); }));
}

// under it: what I'm learning, typed out, held, deleted, next
const TOPICS = ['c++', 'assembly', 'reverse engineering'];
const TYPE = { char: 0.07, hold: 1.8, del: 0.035, gap: 0.35 };
const TYPED = []; let tt = 0;
for (const w of TOPICS) {
  for (let i = 1; i <= w.length; i++) { TYPED.push({ t0: tt, t1: tt + TYPE.char, text: w.slice(0, i) }); tt += TYPE.char; }
  TYPED[TYPED.length - 1].t1 = tt += TYPE.hold;
  for (let i = w.length - 1; i >= 1; i--) { TYPED.push({ t0: tt, t1: tt + TYPE.del, text: w.slice(0, i) }); tt += TYPE.del; }
  TYPED.push({ t0: tt, t1: tt + TYPE.gap, text: '' }); tt += TYPE.gap;
}
const TYPE_LOOP = tt;

// TS: the typed line is sized to stay readable when GitHub scales the 960px image down to a phone (about 0.36x).
// LAST: the last row the render reaches (rows below it are empty), so no dead band sits between the name and the line.
const TS = 24, LAST = 23 + A.top + 2;
const W = 960, FS = W / R.cols / 0.6, LH = FS * 1.02, LINE_Y = 6 + (LAST + 1) * LH + 40, H = Math.round(LINE_Y + 14);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const KF = [];
const win = (t0, t1, total, hold = false) => {
  const id = `k${KF.length}`, p = t => (100 * t / total).toFixed(3);
  KF.push(`@keyframes ${id}{0%{opacity:${t0 <= 0 ? 1 : 0}}${t0 > 0 ? `${p(t0)}%{opacity:1}` : ''}${hold ? '' : `${p(t1)}%,`}100%{opacity:${hold ? 1 : 0}}}`);
  return id;
};
const textBlock = (lines, anim, cls) => `<text class="${cls}" font-size="${FS.toFixed(2)}" style="${anim}">${lines.map((l, j) => `<tspan x="0" y="${(6 + (j + 0.8) * LH).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`;
const svg = t => {
  KF.length = 0;
  // every frame shares one keyframe set: fade in over one slot, out over the next, so neighbours cross-fade
  const slot = A.loop / A.frames, pc = (100 / A.frames).toFixed(4);
  KF.push(`@keyframes au{0%{opacity:0}${pc}%{opacity:1}${(200 / A.frames).toFixed(4)}%,100%{opacity:0}}`);
  const aurora = AURORA.map((lines, i) => textBlock(lines, `animation:au ${A.loop}s linear ${((i - 1) * slot - A.loop).toFixed(3)}s infinite`, `aur f${i ? '' : ' still'}`)).join('\n');
  const typed = TYPED.map(({ t0, t1, text }) => `<tspan style="animation:${win(t0, t1, TYPE_LOOP)} ${TYPE_LOOP}s step-end 0.4s infinite backwards" class="acc f">${esc(text)}</tspan>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="wesper. Currently learning C++, assembly and reverse engineering.">
<title>wesper</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.ink}}
.ice{fill:url(#ice)}.f{opacity:0}.mut{fill:${t.muted}}.acc{fill:${t.accent}}.aur{fill:url(#ice);fill-opacity:.8}
${KF.join('\n')}
@media (prefers-reduced-motion: reduce){.f,tspan{animation:none!important}.f{opacity:0}.f.still,.calm{opacity:1}}</style>
<defs><linearGradient id="ice" gradientUnits="userSpaceOnUse" x1="0" y1="${(6 + (1 + A.top) * LH).toFixed(1)}" x2="0" y2="${(6 + (19 + A.top) * LH).toFixed(1)}">
${[0, 1, 2, 3, 4, 5, 6].map(i => `<stop offset="${(i / 6).toFixed(3)}" stop-color="${t['ice-' + i]}"/>`).join('')}</linearGradient></defs>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${aurora}
${textBlock(NAMEROWS.map(l => l.replace(/\s+$/, '')), '', 'ice')}
<text font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan class="mut" x="4">currently learning  </tspan>${typed.map(s => s.replace('<tspan ', `<tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}" `)).join('')}</text>
<text class="calm acc f" font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}">c++, assembly, reverse engineering</tspan></text>
</svg>`;
};

for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `header-${mode}.svg`), svg(t));
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
