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

// The render: the name, extruded and ray-traced into characters. It holds facing you with a slow drift,
// then makes one full eased turn, the fixed light raking across its faces, and settles again.
const R = { cols: 150, rows: 27, depth: 7, drift: 0.18, pitch: -0.2, sx: 0.66, spinAt: 6, spinFor: 2, hold: 0.4, spinStep: 0.05, loop: 12 };
const NAME = scene(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/name-grid.json'), 'utf8')), R.depth);
const ease = p => p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
const pose = t => {
  const p = Math.min(1, Math.max(0, (t - R.spinAt) / R.spinFor));
  return [R.drift * Math.sin(2 * Math.PI * t / R.loop) + 2 * Math.PI * ease(p), R.pitch + 0.05 * Math.cos(2 * Math.PI * t / R.loop) - 0.16 * Math.sin(Math.PI * p)];
};
const TIMES = [];
for (let t = 0; t < R.spinAt - 1e-9; t += R.hold) TIMES.push([t, Math.min(t + R.hold, R.spinAt)]);
for (let t = R.spinAt; t < R.spinAt + R.spinFor - 1e-9; t += R.spinStep) TIMES.push([t, t + R.spinStep]);
for (let t = R.spinAt + R.spinFor; t < R.loop - 1e-9; t += R.hold) TIMES.push([t, Math.min(t + R.hold, R.loop)]);
const FRAMES = TIMES.map(([t0, t1]) => { const [yaw, pitch] = pose(t0); return { t0, t1, lines: frame(NAME, R.cols, R.rows, yaw, pitch, R.sx, R.sx * 1.7) }; });

// The readout, Matrix-style. Binary rain falls through it; every character starts as a flickering
// bit and locks into its letter as the rain passes, left to right with a little scatter. It holds,
// scrambles back into bits, and decodes again. All digits are the real bits of the text.
const DEC = { loop: 12, start: 0.9, row: 0.28, perChar: 0.035, scatter: 0.55, rescramble: 10.6, flick: 0.18 };
const KEYFRAMES = new Map();
const pct = t => (100 * t / DEC.loop).toFixed(2);
const window_ = (t0, t1, inverse = false) => {   // visible between t0 and t1 (or outside it, if inverse)
  t0 = Math.round(t0 * 20) / 20; t1 = Math.round(t1 * 20) / 20;
  const key = `${inverse ? 'o' : 'w'}${t0}-${t1}`;
  if (!KEYFRAMES.has(key)) {
    const id = `k${KEYFRAMES.size}`, [on, off] = inverse ? [0, 1] : [1, 0];
    KEYFRAMES.set(key, [id, `@keyframes ${id}{0%{opacity:${off}}${pct(t0)}%{opacity:${on}}${pct(t1)}%,100%{opacity:${off}}}`]);
  }
  return KEYFRAMES.get(key)[0];
};
let seed = 0x5eed;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const bitsOf = s => [...Buffer.from(s, 'utf8')].flatMap(b => [...b.toString(2).padStart(8, '0')]);
let DECODE_CSS = '';



const W = 960, X = 8, FS = W / R.cols / 0.6, LH = FS * 1.02;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (t, H, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre}
.r{fill:${t.ink}}.k{fill:${t.muted}}.v{fill:${t.ink}}.d{fill:${t.rule}}
.in{animation:in 1s cubic-bezier(.2,.7,.2,1) .3s backwards}
@keyframes in{from{opacity:0;transform:translateY(8px)}}
${DECODE_CSS}
.w{animation-duration:${DEC.loop}s;animation-timing-function:step-end;animation-iteration-count:infinite}
.fl{fill:${t.muted};animation:fl ${DEC.flick * 2}s step-end infinite}.fl.b{animation-delay:-${DEC.flick}s}
@keyframes fl{0%{opacity:1}50%,100%{opacity:0}}
.rain{fill:${t.muted};animation:fall linear infinite}
@keyframes fall{from{transform:translateY(var(--a))}to{transform:translateY(var(--b))}}
.lock{fill:${t.ink}}
@media (prefers-reduced-motion: reduce){.fr,.in,.w,.fl,.rain{animation:none!important}.fr{opacity:0}.fr.f0{opacity:1}.rain,.scr{display:none}.lock{opacity:1}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${body}
</svg>`;

const ROWS = [
  ['role', 'engineering student'],
  ['good', 'python'],
  ['basic', 'java, html, css'],
  ['teaching myself', 'c, assembly, malware analysis, red teaming'],
  ['speaks', 'arabic, french, english, spanish (learning)'],
  ['based', 'guadix, spain. from morocco'],
];

const profile = t => {
  const top = 8, renderH = R.rows * LH, y0 = top + renderH + 34;
  const frames = FRAMES.map(({ t0, t1, lines }, i) => `<text class="r fr w${i ? '' : ' f0'}" font-size="${FS.toFixed(2)}" style="animation-name:${window_(t0, t1)}">${lines.map((l, j) => `<tspan x="0" y="${(top + (j + 0.8) * LH).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`).join('\n');
  const vx = X + 190, cw = 17 * 0.6, areaH = ROWS.length * 30 + 16, areaTop = y0 + 8;
  const ALL = bitsOf(ROWS.map(r => r[1]).join(''));
  // the rain: columns of real bits falling behind the values, brightest at the head
  let rain = `<clipPath id="area"><rect x="${vx - 4}" y="${areaTop}" width="${W - X - vx + 4}" height="${areaH}"/></clipPath><g clip-path="url(#area)">`;
  for (let c = 0, b = 0; vx + c * cw * 2 < W - X; c++) {
    const n = 9 + Math.floor(rnd() * 7), dur = 2.4 + rnd() * 2.6, x = vx + c * cw * 2, colH = n * 16;
    rain += `<text class="rain scr" font-size="13" style="--a:${-colH}px;--b:${areaH + 20}px;animation-duration:${dur.toFixed(2)}s;animation-delay:${(-rnd() * dur).toFixed(2)}s">` +
      Array.from({ length: n }, (_, k) => `<tspan x="${x.toFixed(1)}" y="${(areaTop + k * 16).toFixed(1)}" fill-opacity="${(0.1 + 0.38 * (k / (n - 1)) ** 2).toFixed(2)}">${ALL[b++ % ALL.length]}</tspan>`).join('') + '</text>';
  }
  rain += '</g>';
  // the values: each character flickers between its own bits, then locks into its letter
  let bit = 0;
  const info = rain + ROWS.map(([k, v], i) => {
    const y = y0 + 30 + i * 30;
    let row = `<text class="k" x="${X}" y="${y}" font-size="17">${k}</text>`;
    [...v].forEach((ch, j) => {
      const x = (vx + j * cw).toFixed(1), r = DEC.start + i * DEC.row + j * DEC.perChar + rnd() * DEC.scatter;
      const bits = bitsOf(ch), b0 = bits[bit % 8], b1 = bits[(bit + 3) % 8]; bit++;
      if (ch !== ' ') row += `<g class="w scr" style="animation-name:${window_(r, DEC.rescramble + rnd() * 0.6, true)}"><text class="fl" x="${x}" y="${y}" font-size="17">${b0}</text><text class="fl b" x="${x}" y="${y}" font-size="17">${b1}</text></g>`;
      row += `<text class="w lock" x="${x}" y="${y}" font-size="17" style="animation-name:${window_(r, DEC.rescramble + rnd() * 0.6)}">${esc(ch)}</text>`;
    });
    return row;
  }).join('\n');
  const H = y0 + 30 + ROWS.length * 30 + 10;
  return [H, 'Wesper, as a 3D ASCII render of the name that holds, spins a full turn, and settles. Each value below decodes out of falling binary, Matrix-style. Engineering student. Good: Python. Basic: Java, HTML, CSS. Teaching myself: C, assembly, malware analysis, red teaming. Speaks Arabic, French, English, Spanish (learning). Based in Guadix, Spain, from Morocco.', `
${frames}
<g class="in"><line x1="${X}" y1="${y0 + 6.5}" x2="${W - X}" y2="${y0 + 6.5}" stroke="${t.rule}"/>
${info}</g>`];
};

for (const [mode, t] of Object.entries(THEMES)) {
  KEYFRAMES.clear(); seed = 0x5eed;
  const [H, label, body] = profile(t);
  DECODE_CSS = [...KEYFRAMES.values()].map(v => v[1]).join('');
  fs.writeFileSync(path.join(OUT, `profile-${mode}.svg`), svg(t, H, label, body));
}
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
