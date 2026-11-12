// Builds the profile image in assets/ from DESIGN.md, in a light and a dark version: the name as a
// rotating 3D ASCII render (tools/ascii3d.mjs over tools/name-grid.json), then a short readout.
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

// The render: the name, extruded and ray-traced into characters, swinging left and right.
const R = { cols: 150, rows: 27, frames: 40, loop: 6, depth: 6, yaw: 0.42, pitch: -0.2, sx: 0.62 };
const NAME = scene(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/name-grid.json'), 'utf8')), R.depth);
const FRAMES = Array.from({ length: R.frames }, (_, i) => {
  const a = 2 * Math.PI * i / R.frames;
  return frame(NAME, R.cols, R.rows, R.yaw * Math.sin(a), R.pitch + 0.05 * Math.cos(a), R.sx, R.sx * 1.7);
});

// The readout decodes itself: each value shows as its real binary, then its real hex, then the hex
// collapses into letters left to right until it reads as plain text. It holds, then starts again.
const DEC = { loop: 12, start: 0.6, stagger: 0.35, bin: 0.55, hex: 0.55, decode: 1.1, steps: 11 };
const KEYFRAMES = [];
const show = (t0, t1) => {
  const id = `s${KEYFRAMES.length}`, p = t => (100 * t / DEC.loop).toFixed(3);
  KEYFRAMES.push(t0 <= 0 ? `@keyframes ${id}{0%{opacity:1}${p(t1)}%,100%{opacity:0}}`
    : t1 >= DEC.loop ? `@keyframes ${id}{0%{opacity:0}${p(t0)}%,100%{opacity:1}}`
    : `@keyframes ${id}{0%{opacity:0}${p(t0)}%{opacity:1}${p(t1)}%,100%{opacity:0}}`);
  return id;
};
const hexOf = s => [...Buffer.from(s, 'utf8')].map(b => b.toString(16).padStart(2, '0')).join('');
const binOf = s => [...Buffer.from(s, 'utf8')].map(b => b.toString(2).padStart(8, '0')).join(' ');
function decodeRow(v, i) {
  const s0 = DEC.start + i * DEC.stagger, h0 = s0 + DEC.bin, d0 = h0 + DEC.hex, f0 = d0 + DEC.decode, dt = DEC.decode / DEC.steps;
  const states = [{ text: binOf(v), cls: 'bin', id: show(0, h0) }, { text: hexOf(v), cls: 'hx', id: show(h0, d0) }];
  for (let k = 1; k < DEC.steps; k++) {
    const c = Math.round(v.length * k / DEC.steps);
    states.push({ text: v.slice(0, c), rest: hexOf(v.slice(c)), cls: 'v', id: show(d0 + (k - 1) * dt, d0 + k * dt) });
  }
  states.push({ text: v, cls: 'v fin', id: show(f0 - dt, DEC.loop) });
  return states;
}
let DECODE_CSS = '';

const W = 960, X = 8, FS = W / R.cols / 0.6, LH = FS * 1.02;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (t, H, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre}
.r{fill:${t.ink}}.k{fill:${t.muted}}.v{fill:${t.ink}}.d{fill:${t.rule}}
.fr{opacity:0;animation:fr ${R.loop}s step-end infinite}.fr.f0{opacity:1}
@keyframes fr{0%{opacity:1}${(100 / R.frames).toFixed(3)}%,100%{opacity:0}}
.in{animation:in 1s cubic-bezier(.2,.7,.2,1) .3s backwards}
@keyframes in{from{opacity:0;transform:translateY(8px)}}
${DECODE_CSS}
.st{opacity:0;animation-duration:${DEC.loop}s;animation-timing-function:step-end;animation-iteration-count:infinite}
.bin,.hx{fill:${t.muted}}
@media (prefers-reduced-motion: reduce){.fr,.in,.st{animation:none}.fr,.st{opacity:0}.fr.f0,.st.fin{opacity:1}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${body}
</svg>`;

const ROWS = [
  ['good', 'python'],
  ['basic', 'java, html, css'],
  ['teaching myself', 'c, assembly, malware analysis, red teaming'],
  ['speaks', 'arabic, french, english, spanish (learning)'],
  ['based', 'guadix, spain. from morocco'],
];

const profile = t => {
  const top = 8, renderH = R.rows * LH, y0 = top + renderH + 34;
  const frames = FRAMES.map((lines, i) => `<text class="r fr${i ? '' : ' f0'}" font-size="${FS.toFixed(2)}" style="animation-delay:${(i * R.loop / R.frames).toFixed(3)}s">${lines.map((l, j) => `<tspan x="0" y="${(top + (j + 0.8) * LH).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`).join('\n');
  const vx = X + 190;
  const info = `<clipPath id="col"><rect x="${vx}" y="${y0}" width="${W - X - vx}" height="${ROWS.length * 30 + 20}"/></clipPath>` +
    ROWS.map(([k, v], i) => `<text class="k" x="${X}" y="${y0 + 30 + i * 30}" font-size="17">${k}</text>
<g clip-path="url(#col)">${decodeRow(v, i).map(({ text, rest, cls, id }) => `<text class="st ${cls}" x="${vx}" y="${y0 + 30 + i * 30}" font-size="17" style="animation-name:${id}">${esc(text)}${rest ? `<tspan class="hx">${rest}</tspan>` : ''}</text>`).join('')}</g>`).join('\n');
  const H = y0 + 30 + ROWS.length * 30 + 10;
  return [H, 'Rayane, engineering student, rendered as a rotating 3D ASCII render of the name. Each value below decodes from binary to hex to plain text. Good: Python. Basic: Java, HTML, CSS. Teaching myself: C, assembly, malware analysis, red teaming. Speaks Arabic, French, English, Spanish (learning). Based in Guadix, Spain, from Morocco.', `
${frames}
<g class="in"><text class="k" x="${X}" y="${y0 - 6}" font-size="14">rayane, engineering student</text>
<line x1="${X}" y1="${y0 + 6.5}" x2="${W - X}" y2="${y0 + 6.5}" stroke="${t.rule}"/>
${info}</g>`];
};

for (const [mode, t] of Object.entries(THEMES)) {
  KEYFRAMES.length = 0;
  const [H, label, body] = profile(t);
  DECODE_CSS = KEYFRAMES.join('');
  fs.writeFileSync(path.join(OUT, `profile-${mode}.svg`), svg(t, H, label, body));
}
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
