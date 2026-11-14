// Builds the README header in assets/ from DESIGN.md, in a light and a dark version: the handle as a
// 3D ASCII render (tools/ascii3d.mjs over tools/name-grid.json) with a scan beam that shows its insides.
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

// the scan: a single beam crosses the name, left to right, then rests. The strip just behind it
// shows the letters' insides: their outline as edges, their body as the bytes of "wesper" in hex.
// Ahead of the beam and once it has passed, the name is its usual solid self. Nothing moves but the beam.
const SCAN = { start: 0.8, step: 0.05, cols: 2, band: 18, loop: 7.5 };
const HEX = Buffer.from('wesper', 'ascii').toString('hex');
const at = (r, c) => (FINAL[r] || '').padEnd(R.cols)[c] || ' ';
const inside = (r, c) => {
  if (at(r, c) === ' ') return ' ';
  const u = at(r - 1, c) !== ' ', d = at(r + 1, c) !== ' ', l = at(r, c - 1) !== ' ', rt = at(r, c + 1) !== ' ';
  if (u && d && l && rt) return HEX[(c + r * 3) % HEX.length];
  if (l && rt && !(u && d)) return '-';
  if (u && d && !(l && rt)) return '|';
  return '+';
};
const SWEEP = [];
for (let x = 0, t = SCAN.start; x <= R.cols + SCAN.band; x += SCAN.cols, t += SCAN.step) {
  const c0 = Math.max(0, x - SCAN.band), c1 = Math.min(R.cols, x);
  SWEEP.push({ t0: t, t1: t + SCAN.step, x, c0, c1,
    lines: FINAL.map((_, r) => { let s = ''; for (let c = c0; c < c1; c++) s += inside(r, c); return s; }) });
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
  const CW = FS * 0.6, top = 6, bot = (6 + (LAST + 1.3) * LH).toFixed(1);
  const scan = SWEEP.map(({ t0, t1, x, c0, c1, lines }) => {
    const anim = `animation:${win(t0, t1, SCAN.loop)} ${SCAN.loop}s step-end infinite backwards`;
    const mask = c1 > c0 ? `<rect x="${(c0 * CW).toFixed(1)}" y="${top}" width="${((c1 - c0) * CW).toFixed(1)}" height="${(bot - top).toFixed(1)}" fill="${t.paper}"/>` : '';
    const body = c1 > c0 ? `<text class="acc" font-size="${FS.toFixed(2)}">${lines.map((l, j) => `<tspan x="${(c0 * CW).toFixed(1)}" y="${(6 + (j + 0.8) * LH).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>` : '';
    const beam = x <= R.cols ? `<rect class="beam" x="${(x * CW).toFixed(1)}" y="${top}" width="1.5" height="${(bot - top).toFixed(1)}"/>` : '';
    return `<g class="f" style="${anim}">${mask}${body}${beam}</g>`;
  }).join('\n');
  const typed = TYPED.map(({ t0, t1, text }) => `<tspan style="animation:${win(t0, t1, TYPE_LOOP)} ${TYPE_LOOP}s step-end 0.4s infinite backwards" class="acc f">${esc(text)}</tspan>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="wesper. Currently learning C++, assembly and reverse engineering.">
<title>wesper</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.ink}}
.ice{fill:url(#ice)}.f{opacity:0}.mut{fill:${t.muted}}.acc{fill:${t.accent}}.beam{fill:${t.accent}}
${KF.join('\n')}
@media (prefers-reduced-motion: reduce){.f,tspan{animation:none!important}.f{opacity:0}.calm{opacity:1}}</style>
<defs><linearGradient id="ice" gradientUnits="userSpaceOnUse" x1="0" y1="${(6 + 1 * LH).toFixed(1)}" x2="0" y2="${(6 + 19 * LH).toFixed(1)}">
${[0, 1, 2, 3, 4, 5, 6].map(i => `<stop offset="${(i / 6).toFixed(3)}" stop-color="${t['ice-' + i]}"/>`).join('')}</linearGradient></defs>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${textBlock(FINAL.map(l => l.replace(/\s+$/, '')), '', 'ice')}
${scan}
<text font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan class="mut" x="4">currently learning  </tspan>${typed.map(s => s.replace('<tspan ', `<tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}" `)).join('')}</text>
<text class="calm acc f" font-size="${TS}" y="${LINE_Y.toFixed(1)}"><tspan x="${(4 + 20 * TS * 0.6).toFixed(1)}">c++, assembly, reverse engineering</tspan></text>
</svg>`;
};

// The trace: a real program (tools/trace/wesper.cpp), its real disassembly and a real gdb run of it,
// replayed one instruction at a time. Source on the left, machine code on the right, and the registers
// and output as they actually were at each step. The display strings below only tidy objdump's spacing.
const SRC = fs.readFileSync(path.join(ROOT, 'tools/trace/wesper.cpp'), 'utf8').replace(/\s+$/, '').split('\n');
const ASM = [
  [0x401136, 'endbr64', 3], [0x40113a, 'push   rbx', 3], [0x40113b, 'mov    ebx, 0x402004', 4],
  [0x401140, 'mov    edi, 0x77', 5], [0x401145, 'add    rbx, 1', 5], [0x401149, 'movsx  edi, dil', 5],
  [0x40114d, 'mov    rsi, [rip+0x2ec4]  ; stdout', 5], [0x401154, 'call   putc', 5],
  [0x401159, 'movzx  edi, byte [rbx]', 5], [0x40115c, 'test   dil, dil', 5], [0x40115f, 'jne    401145', 5],
  [0x401161, 'mov    eax, 0', 6], [0x401166, 'pop    rbx', 6], [0x401167, 'ret', 6],
];
const STEPS = []; let printed = '';
for (const l of fs.readFileSync(path.join(ROOT, 'tools/trace/trace.txt'), 'utf8').trim().split('\n')) {
  const [, rip, rbx, edi] = l.split(' ').map(v => parseInt(v, 16));
  if (STEPS.length && STEPS[STEPS.length - 1].rip === 0x401154) printed += String.fromCharCode(STEPS[STEPS.length - 1].edi);
  STEPS.push({ rip, rbx, edi, out: printed });
}
const T = { fs: 20, lh: 29, step: 0.34, hold: 3.2, asmCol: 33, pad: 22 };
const traceSvg = t => {
  KF.length = 0;
  const cw = T.fs * 0.6, x = c => (T.pad + c * cw).toFixed(1), y = r => (T.pad + 36 + (r + 1) * T.lh).toFixed(1);
  const rows = ASM.length, Wd = 960, Ht = Math.round(T.pad * 2 + 36 + rows * T.lh + 12), total = STEPS.length * T.step + T.hold;
  const bar = (r, c0, c1) => `<rect class="hl" x="${(T.pad + c0 * cw - 8).toFixed(1)}" y="${(y(r) - T.lh * 0.72).toFixed(1)}" width="${((c1 - c0) * cw + 16).toFixed(1)}" height="${T.lh}"/><rect class="tick" x="${(T.pad + c0 * cw - 8).toFixed(1)}" y="${(y(r) - T.lh * 0.72).toFixed(1)}" width="2" height="${T.lh}"/>`;
  const h = (v, n) => v.toString(16).padStart(n, '0');
  const state = (s, i) => {
    const last = i === STEPS.length - 1, a = ASM.findIndex(([ad]) => ad === s.rip), ch = s.edi > 32 && s.edi < 127 ? `  '${String.fromCharCode(s.edi)}'` : '';
    const anim = `animation:${win(i * T.step, last ? total : (i + 1) * T.step, total)} ${total}s step-end infinite backwards`;
    return `<g class="f${last ? ' calm' : ''}" style="${anim}">${bar(a, T.asmCol, 78 - 0)}${bar(ASM[a][2] - 1, 0, 30)}
<text font-size="${T.fs}"><tspan class="ink" x="${x(5)}" y="${y(8)}">${h(s.rip, 6)}</tspan><tspan class="ink" x="${x(5)}" y="${y(9)}">${h(s.rbx, 6)}</tspan><tspan class="ink" x="${x(5)}" y="${y(10)}">${h(s.edi, 8)}</tspan><tspan class="acc" x="${x(13)}" y="${y(10)}">${esc(ch)}</tspan><tspan class="acc" x="${x(8)}" y="${y(12)}">${esc(s.out)}${last ? '' : '_'}</tspan></text></g>`;
  };
  const states = STEPS.map(state).join('\n');
  const split = (T.pad + (T.asmCol - 2) * cw).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="A six-line C++ program that prints wesper, next to its x86-64 machine code, stepped through one instruction at a time.">
<title>wesper.cpp, stepped through</title>
<style>${MONO}
text{font-family:"JetBrains Mono",ui-monospace,monospace;white-space:pre;fill:${t.muted}}
.ink{fill:${t.ink}}.acc{fill:${t.accent}}.f{opacity:0}.hl{fill:${t.accent};opacity:.14}.tick{fill:${t.accent}}.rule{stroke:${t.muted};stroke-opacity:.35;fill:none}
${KF.join('\n')}
@media (prefers-reduced-motion: reduce){.f{animation:none!important;opacity:0}.f.calm{opacity:1}}</style>
<rect width="${Wd}" height="${Ht}" fill="${t.paper}"/>
<rect class="rule" x="0.5" y="0.5" width="${Wd - 1}" height="${Ht - 1}"/><path class="rule" d="M${split} 0V${Ht}M0 ${(T.pad + 34).toFixed(1)}H${Wd}"/>
${states}
<text font-size="${T.fs}"><tspan x="${x(0)}" y="${(T.pad + 20).toFixed(1)}">wesper.cpp</tspan><tspan x="${x(T.asmCol)}" y="${(T.pad + 20).toFixed(1)}">g++ -O1, x86-64</tspan>
${SRC.map((l, r) => `<tspan class="ink" x="${x(0)}" y="${y(r)}">${esc(l)}</tspan>`).join('')}
${ASM.map(([ad, ins], r) => `<tspan x="${x(T.asmCol)}" y="${y(r)}">${h(ad, 6)}</tspan><tspan class="ink" x="${x(T.asmCol + 8)}" y="${y(r)}">${esc(ins)}</tspan>`).join('')}
<tspan x="${x(0)}" y="${y(8)}">rip</tspan><tspan x="${x(0)}" y="${y(9)}">rbx</tspan><tspan x="${x(0)}" y="${y(10)}">edi</tspan><tspan x="${x(0)}" y="${y(12)}">stdout</tspan></text>
</svg>`;
};
for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `trace-${mode}.svg`), traceSvg(t));

for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(path.join(OUT, `header-${mode}.svg`), svg(t));
console.log('built', fs.readdirSync(OUT).map(n => `${n} ${(fs.statSync(path.join(OUT, n)).size / 1024).toFixed(0)}KB`).join(', '));
