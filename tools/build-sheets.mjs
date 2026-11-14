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

// The panels: the profile's content (profile.json) set in plain-ASCII frames, two columns. Frames are
// there from the start; each line is uncovered left to right, one after another, once. Bars are a level
// in words, drawn: the word beside each bar is the truth, the bar is just its picture.
const PROFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'profile.json'), 'utf8'));
const P = { fs: 22, lh: 30, left: 34, gap: 2, right: 36, bar: 8, per: 0.22, wipe: 0.45 };
const wrap = (text, w) => { const out = []; let l = '';
  for (const word of text.split(/\s+/)) { if (l && (l + ' ' + word).length > w) { out.push(l); l = word; } else l = l ? l + ' ' + word : word; }
  if (l) out.push(l); return out; };
const panel = (p, w) => {
  const inner = w - 4, top = `+- ${p.title} ${'-'.repeat(w - 5 - p.title.length)}+`, bottom = `+${'-'.repeat(w - 2)}+`;
  const body = p.text ? wrap(p.text, inner).map(l => ({ text: l }))
    : p.levels.map(([name, level]) => ({ text: name.padEnd(10) + ' ', bar: PROFILE.bars[level] || 0, level }));
  return { title: p.title, top, bottom, body, cursor: p.cursor, w };
};
const column = (list, w) => { const rows = []; for (const p of list.map(q => panel(q, w))) { rows.push({ kind: 'top', p }); for (const b of p.body) rows.push({ kind: 'line', p, b }); rows.push({ kind: 'bottom', p }); rows.push({ kind: 'gap' }); } rows.pop(); return rows; };
const COLS = [[0, column(PROFILE.left, P.left)], [P.left + P.gap, column(PROFILE.right, P.right)]];
const panelsSvg = t => {
  const cw = P.fs * 0.6, padX = (960 - (P.left + P.gap + P.right) * cw) / 2, x = c => (padX + c * cw).toFixed(1), y = r => (10 + (r + 0.75) * P.lh).toFixed(1);
  const Ht = Math.round(20 + Math.max(...COLS.map(([, rows]) => rows.length)) * P.lh);
  const frame = [], text = [], covers = []; let n = 0, endOfNow = null;
  for (const [c0, rows] of COLS) rows.forEach((row, r) => {
    if (row.kind === 'gap') return;
    if (row.kind !== 'line') { const s = row.kind === 'top' ? row.p.top : row.p.bottom;
      if (row.kind === 'top') { frame.push(`<tspan x="${x(c0)}" y="${y(r)}">+- </tspan><tspan class="acc">${esc(row.p.title)}</tspan><tspan> ${s.slice(4 + row.p.title.length)}</tspan>`); }
      else frame.push(`<tspan x="${x(c0)}" y="${y(r)}">${s}</tspan>`); return; }
    frame.push(`<tspan x="${x(c0)}" y="${y(r)}">|</tspan><tspan x="${x(c0 + row.p.w - 1)}" y="${y(r)}">|</tspan>`);
    const b = row.b; let line = `<tspan class="ink" x="${x(c0 + 2)}" y="${y(r)}">${esc(b.text)}</tspan>`;
    if (b.level) line += `<tspan class="ice">${'#'.repeat(b.bar)}</tspan><tspan class="dim">${'.'.repeat(P.bar - b.bar)}</tspan><tspan>  ${esc(b.level)}</tspan>`;
    text.push(line);
    const delay = (0.3 + n++ * P.per).toFixed(2);
    covers.push(`<rect class="cover" x="${x(c0 + 2)}" y="${(y(r) - P.lh * 0.72).toFixed(1)}" width="${((row.p.w - 4) * cw).toFixed(1)}" height="${P.lh}" style="animation-delay:${delay}s"/>`);
    if (row.p.cursor && rows[r + 1].kind === 'bottom') endOfNow = [c0 + 2 + b.text.length, r];
  });
  const cursor = endOfNow ? `<text class="acc cur" font-size="${P.fs}" x="${x(endOfNow[0])}" y="${y(endOfNow[1])}">_</text>` : '';
  const stops = [1, 2, 3, 4, 5].map((i, k) => `<stop offset="${(k / 4).toFixed(2)}" stop-color="${t['ice-' + (t === THEMES.dark ? i : i + 1)]}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${Ht}" viewBox="0 0 960 ${Ht}" role="img" aria-label="${esc(PANELS_ALT)}">
<title>about wesper</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.muted}}
.ink{fill:${t.ink}}.acc{fill:${t.accent}}.ice{fill:url(#bar)}.dim{fill:${t.muted};fill-opacity:.45}
.cover{fill:${t.paper};transform-box:fill-box;transform-origin:right;animation:wipe ${P.wipe}s steps(24) both}
.cur{opacity:0;animation:blink 1.1s step-end ${(0.3 + n * P.per + P.wipe).toFixed(2)}s infinite}
@keyframes wipe{to{transform:scaleX(0)}}@keyframes blink{0%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.cover{display:none}.cur{animation:none;opacity:1}}</style>
<defs><linearGradient id="bar" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="960" y2="0">${stops}</linearGradient></defs>
<rect width="960" height="${Ht}" fill="${t.paper}"/>
<text font-size="${P.fs}">${text.join('')}</text>
${covers.join('')}
<text font-size="${P.fs}">${frame.join('')}</text>
${cursor}
</svg>`;
};
const sentence = p => p.text ? `${p.title[0].toUpperCase()}${p.title.slice(1)}: ${p.text}` : `${p.title[0].toUpperCase()}${p.title.slice(1)}: ${p.levels.map(([n, l]) => `${n} (${l})`).join(', ')}.`;
const PANELS_ALT = [...PROFILE.left, ...PROFILE.right].map(sentence).join(' ');
for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `panels-${mode}.svg`), panelsSvg(t));
// keep the README's alt text for the panels in step with profile.json
const readmePath = path.join(ROOT, 'README.md'), readme = fs.readFileSync(readmePath, 'utf8');
fs.writeFileSync(readmePath, readme.replace(/(<img src="assets\/panels-light\.svg"[^>]*alt=")[^"]*"/, (_, a) => `${a}${PANELS_ALT.replace(/"/g, '&quot;')}"`));

for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `header-${mode}.svg`), svg(t));
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
