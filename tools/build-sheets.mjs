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

// The render: the handle, extruded and ray-traced into characters, at a slight fixed angle. It never
// moves. On load it decodes out of its own bits once; after that it stays alive: the light drifts
// across it, and now and then a few cells flicker back to raw bits for a moment.
const R = { cols: 150, rows: 27, depth: 7, yaw: 0.24, pitch: -0.2, sx: 0.66,
  decodeAt: 0.25, decodeFor: 1.2, step: 0.06, loop: 10, loopStep: 0.25 };
const NAME = scene(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/name-grid.json'), 'utf8')), R.depth);
const lightAt = t => [0.16 * Math.sin(2 * Math.PI * t / R.loop) - 0.28, 0.5, -0.85];
const render = t => frame(NAME, R.cols, R.rows, R.yaw, R.pitch, R.sx, R.sx * 1.7, lightAt(t));
const FINAL = render(0);
const BITS = [...Buffer.from('wesper', 'ascii')].flatMap(b => [...b.toString(2).padStart(8, '0')]);
let rs = 0x51ee;
const rnd = () => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const jitter = FINAL.map(l => [...l.padEnd(R.cols)].map(() => rnd()));
const lockAt = (r, c) => R.decodeAt + R.decodeFor * (0.82 * c / R.cols + 0.18 * jitter[r][c]);
const END = R.decodeAt + R.decodeFor + R.step;
const trim = cells => cells.join('').replace(/\s+$/, '');

// once: the decode
const DECODE = [[0, R.decodeAt]];
for (let t = R.decodeAt; t < END - 1e-9; t += R.step) DECODE.push([t, Math.min(t + R.step, END)]);
const ONCE = DECODE.map(([t0, t1], n) => ({ t0, t1, lines: FINAL.map((l, r) => trim([...l.padEnd(R.cols)].map((ch, c) => ch === ' ' ? ' ' : t0 >= lockAt(r, c) ? ch : BITS[(r * 7 + c * 3 + n) % BITS.length]))) }));

// forever after: the light drifts; in about one frame in three, a short run of cells flips to bits
const LIVE = [];
for (let t = 0, n = 0; t < R.loop - 1e-9; t += R.loopStep, n++) {
  const lit = render(t).map(l => [...l.padEnd(R.cols)]);
  if (rnd() < 0.35) for (let k = 0; k < 1 + Math.floor(rnd() * 2); k++) {
    const r = Math.floor(rnd() * R.rows), c0 = Math.floor(rnd() * R.cols), len = 3 + Math.floor(rnd() * 6);
    for (let c = c0; c < Math.min(R.cols, c0 + len); c++) if (lit[r][c] !== ' ') lit[r][c] = BITS[(r + c + n) % BITS.length];
  }
  LIVE.push({ t0: t, t1: Math.min(t + R.loopStep, R.loop), lines: lit.map(trim) });
}

// under it: what I'm learning, typed out, held, deleted, next
const TOPICS = ['c', 'assembly', 'malware analysis', 'red teaming'];
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
const TS = 24, LAST = 23;
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
  const once = ONCE.map(({ t0, t1, lines }) => textBlock(lines, `animation:${win(t0, t1, END)} ${END}s step-end 1 both`, 'ice f')).join('\n');
  const live = LIVE.map(({ t0, t1, lines }, i) => textBlock(lines, `animation:${win(t0, t1, R.loop)} ${R.loop}s step-end ${END}s infinite backwards`, `ice f${i ? '' : ' still'}`)).join('\n');
  const typed = TYPED.map(({ t0, t1, text }) => `<tspan style="animation:${win(t0, t1, TYPE_LOOP)} ${TYPE_LOOP}s step-end ${END}s infinite backwards" class="acc f">${esc(text)}</tspan>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="wesper. Currently learning C, assembly, malware analysis and red teaming.">
<title>wesper</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.ink}}
.ice{fill:url(#ice)}.f{opacity:0}.mut{fill:${t.muted}}.acc{fill:${t.accent}}
${KF.join('\n')}
@media (prefers-reduced-motion: reduce){.f,tspan{animation:none!important}.f{opacity:0}.f.still,.calm{opacity:1}}</style>
<defs><linearGradient id="ice" gradientUnits="userSpaceOnUse" x1="0" y1="${(6 + 1 * LH).toFixed(1)}" x2="0" y2="${(6 + 19 * LH).toFixed(1)}">
${[0, 1, 2, 3, 4, 5, 6].map(i => `<stop offset="${(i / 6).toFixed(3)}" stop-color="${t['ice-' + i]}"/>`).join('')}</linearGradient></defs>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${once}
${live}
<text font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan class="mut" x="4">currently learning  </tspan>${typed.map(s => s.replace('<tspan ', `<tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}" `)).join('')}</text>
<text class="calm acc f" font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}">c, assembly, malware analysis, red teaming</tspan></text>
</svg>`;
};

for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `header-${mode}.svg`), svg(t));
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
