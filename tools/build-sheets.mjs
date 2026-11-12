// Builds the profile sheets in assets/ from DESIGN.md. Run: node tools/build-sheets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
fs.mkdirSync(OUT, { recursive: true });

// Tokens come from DESIGN.md, nowhere else.
const design = fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8');
const tok = {};
for (const [, name, L, C, H] of design.matchAll(/--color-([\w-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g)) tok[name] = hex(+L / 100, +C, +H);

function hex(L, C, h) {
  const r = h * Math.PI / 180, A = C * Math.cos(r), B = C * Math.sin(r);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return '#' + [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('');
}

const f = n => fs.readFileSync(path.join(ROOT, 'tools/fonts', n)).toString('base64');
const face = (fam, w, file, style = 'normal') => `@font-face{font-family:"${fam}";font-weight:${w};font-style:${style};src:url(data:font/woff2;base64,${f(file)}) format("woff2")}`;
const fonts = {
  display: face('Cinzel', 400, 'cinzel-latin-400-normal.woff2') + face('Cinzel', 600, 'cinzel-latin-600-normal.woff2'),
  body: face('EB Garamond', 400, 'eb-garamond-latin-400-normal.woff2') + face('EB Garamond', 500, 'eb-garamond-latin-500-normal.woff2') + face('EB Garamond', 400, 'eb-garamond-latin-400-italic.woff2', 'italic'),
  mono: face('Azeret Mono', 500, 'azeret-mono-latin-500-normal.woff2'),
  arabic: face('Amiri', 400, 'amiri-arabic-400-normal.woff2'),
};
const css = need => `${need.map(n => fonts[n]).join('')}
.h{font-family:"Cinzel",serif;font-weight:600;letter-spacing:0.08em;fill:${tok.ink}}
.w{font-family:"Cinzel",serif;font-weight:600;letter-spacing:0.2em}
.b{font-family:"EB Garamond",serif;font-weight:400;fill:${tok['ink-2']}}
.i{font-family:"EB Garamond",serif;font-weight:400;font-style:italic;fill:${tok['ink-2']}}
.l{font-family:"EB Garamond",serif;font-weight:500;fill:${tok.muted}}
.v{font-family:"EB Garamond",serif;font-weight:500;fill:${tok.ink}}
.m{font-family:"Azeret Mono",monospace;font-weight:500;fill:${tok.muted}}
.a{font-family:"Azeret Mono",monospace;font-weight:500;white-space:pre}
.ar{font-family:"Amiri",serif;font-weight:400;fill:${tok.ink}}`;

const chrome = `<defs><linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${tok['chrome-1']}"/><stop offset="0.42" stop-color="${tok['chrome-2']}"/>
<stop offset="0.55" stop-color="${tok['chrome-3']}"/><stop offset="1" stop-color="${tok['chrome-4']}"/></linearGradient></defs>`;

const W = 960;
const svg = (H, label, need, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${css(need)}</style>
${chrome}
<rect width="${W}" height="${H}" fill="${tok.paper}"/>
${body}
</svg>`;

// Ornament: the menu frame, a diamond, a divider. These are the only ornaments.
const diamond = (x, y, s, fill) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${fill}" transform="rotate(45 ${x} ${y})"/>`;
const frame = (x, y, w, h) => `<rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" fill="none" stroke="${tok.rule}"/>
<rect x="${x + 4.5}" y="${y + 4.5}" width="${w - 9}" height="${h - 9}" fill="none" stroke="${tok['rule-2']}"/>
${[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([a, b]) => diamond(a, b, 7, tok.rule)).join('')}`;
const divider = (cx, y, w) => `<line x1="${cx - w / 2}" y1="${y + .5}" x2="${cx - 10}" y2="${y + .5}" stroke="${tok.rule}"/>
<line x1="${cx + 10}" y1="${y + .5}" x2="${cx + w / 2}" y2="${y + .5}" stroke="${tok.rule}"/>${diamond(cx, y + .5, 6, tok.ember)}`;

// The sigil, drawn in ASCII. Each nibble of the name grows one thorn off a central spine, mirrored left to right;
// each stroke is sampled onto a character grid and every cell takes the
// character that matches the stroke's direction there (- \ | /), tips become '.', the spine stays '|'.
function asciiSigil(name, cx, top, H, fs) {
  const nib = [...Buffer.from(name, 'ascii')].flatMap(b => [b >> 4, b & 15]);
  const n = nib.length, cw = fs * 0.6, ch = fs * 1.05;
  const cols = Math.ceil(H * 1.02 / cw) | 1, rows = Math.ceil(H / ch) + 1, x0 = cx - (cols * cw) / 2;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const put = (x, y, c) => { const i = Math.floor((y - top) / ch), j = Math.floor((x - x0) / cw); if (i >= 0 && i < rows && j >= 0 && j < cols) grid[i][j] = c; };
  const dir = (dx, dy) => { let a = Math.atan2(dy, dx) * 180 / Math.PI; a = ((a % 180) + 180) % 180; return a < 22.5 || a >= 157.5 ? '-' : a < 67.5 ? '\\' : a < 112.5 ? '|' : '/'; };
  const quad = (ax, ay, bx, by, ex, ey) => {
    for (let t = 0; t <= 1; t += 0.004) {
      const u = 1 - t, x = u * u * ax + 2 * u * t * bx + t * t * ex, y = u * u * ay + 2 * u * t * by + t * t * ey;
      put(x, y, t > 0.95 ? '.' : dir(2 * u * (bx - ax) + 2 * t * (ex - bx), 2 * u * (by - ay) + 2 * t * (ey - by)));
    }
  };
  const sum = nib.reduce((a, b) => a + b, 0), r = H * 0.3, g = (sum % 60 + 20) * Math.PI / 180;
  for (const [a0, a1] of [[g, Math.PI - g / 2], [Math.PI + g / 2, 2 * Math.PI - g]])
    for (let a = a0; a <= a1; a += 0.004) put(cx + r * Math.sin(a), top + H / 2 - r * Math.cos(a), dir(Math.cos(a), Math.sin(a)));
  nib.forEach((v, i) => {
    const y = top + H * (0.1 + 0.8 * (i + 0.5) / n), L = H * (0.16 + 0.3 * v / 15), up = v & 1 ? -1 : 1;
    const ang = (12 + 16 * ((v >> 1) & 3)) * Math.PI / 180, bend = (v & 8 ? 1 : -1) * L * 0.22 * up;
    for (const s of [1, -1]) {
      const x1 = cx + s * L * Math.cos(ang), y1 = y + up * L * Math.sin(ang), dx = x1 - cx, dy = y1 - y, len = Math.hypot(dx, dy);
      const mx = (cx + x1) / 2 + (-dy / len) * bend * s, my = (y + y1) / 2 + (dx / len) * bend * s;
      quad(cx, y, mx, my, x1, y1);
    }
  });
  for (let y = top; y <= top + H; y += ch / 4) put(cx, y, '|');
  put(cx, top, '.'); put(cx, top + H - 1, "'");
  const esc = c => c === '&' ? '&amp;' : c === '<' ? '&lt;' : c;
  return `<text class="a" x="${x0}" y="${top}" font-size="${fs}" style="fill:url(#chrome)">${grid.map((row, i) => `<tspan x="${x0.toFixed(1)}" y="${(top + (i + 0.8) * ch).toFixed(1)}">${row.map(esc).join('')}</tspan>`).join('')}</text>`;
}
const bytes = s => [...Buffer.from(s, 'ascii')].map(b => b.toString(16)).join(' ');

// Header: a title screen. The sigil, the wordmark, who I am, the languages in their own scripts.
{
  const H = 580, cx = W / 2;
  const langs = [['ar', 'العربية', 52], ['v', 'Français', 66], ['v', 'English', 56], ['v', 'Español', 60], ['i', '(learning)', 70]];
  const total = langs.reduce((a, [, , w]) => a + w, 0) + 28 * (langs.length - 2) + 8;
  let lx = cx - total / 2, row = '';
  langs.forEach(([c, w, width], i) => { row += `<text class="${c}" x="${lx}" y="522" font-size="${c === 'ar' ? 22 : 20}">${w}</text>`; lx += width + (i === langs.length - 2 ? 8 : 28); });
  const body = `
${frame(24, 24, W - 48, H - 48)}
${asciiSigil('wesper', cx, 56, 250, 9)}
<text class="w" x="${cx + 10}" y="364" font-size="64" text-anchor="middle" style="fill:url(#chrome)">WESPER</text>
${divider(cx, 392, 300)}
<text class="i" x="${cx}" y="430" font-size="22" text-anchor="middle">Engineering student from Morocco, living in Guadix, Spain.</text>
<text class="i" x="${cx}" y="460" font-size="22" text-anchor="middle">Python first, working my way down the stack.</text>
${row}
<text class="m" x="52" y="${H - 44}" font-size="12">${bytes('wesper')}</text>`;
  fs.writeFileSync(`${OUT}/header.svg`, svg(H, `WESPER. Engineering student from Morocco, living in Guadix, Spain. Python first, working my way down the stack. Speaks Arabic, French, English and Spanish (learning). The sigil is grown from the bytes of wesper, ${bytes('wesper')}.`, ['display', 'body', 'mono', 'arabic'], body));
}

// Stack: a menu. One row selected, its description beside it.
{
  const rows = [
    ['AI systems', 'next'],
    ['Web: HTML, CSS', 'learning'],
    ['Python', 'solid'],
    ['Java', 'learning'],
    ['C, the basics', 'curious'],
    ['Assembly, the basics', 'curious'],
  ];
  const X = 56, top = 168, rh = 50, LW = 470, PX = X + LW + 24, PW = W - 56 - PX;
  const H = top + rows.length * rh + 64;
  let b = `
<text class="h" x="${X}" y="92" font-size="34">THE STACK</text>
<text class="i" x="${X}" y="128" font-size="20">Top is furthest from the machine. I'm working my way down.</text>
${frame(X - 16, top - 20, LW + 16, rows.length * rh + 40)}`;
  rows.forEach(([what, status], i) => {
    const y = top + i * rh, sel = status === 'solid';
    if (sel) b += `<rect x="${X}" y="${y + 3}" width="${LW - 16}" height="${rh - 6}" fill="${tok['paper-2']}"/>${diamond(X + 14, y + rh / 2, 8, tok.ember)}`;
    b += `<text class="v" x="${X + 34}" y="${y + 32}" font-size="20">${what}</text>
<text class="i" x="${X + LW - 34}" y="${y + 32}" font-size="19" text-anchor="end"${sel ? ` style="fill:${tok.ember}"` : ''}>${status}</text>`;
    if (i < rows.length - 1) b += `<line x1="${X + 34}" y1="${y + rh + .5}" x2="${X + LW - 34}" y2="${y + rh + .5}" stroke="${tok['rule-2']}"/>`;
  });
  const ph = rows.length * rh + 40;
  b += `
${frame(PX, top - 20, PW, ph)}
<text class="h" x="${PX + 32}" y="${top + 30}" font-size="26">PYTHON</text>
<text class="i" x="${PX + 32}" y="${top + 62}" font-size="19" style="fill:${tok.ember}">solid</text>
<text class="b" x="${PX + 32}" y="${top + 104}" font-size="20">The language I'm good with,</text>
<text class="b" x="${PX + 32}" y="${top + 130}" font-size="20">and the one I build in.</text>
<line x1="${PX + 32}" y1="${top + 178.5}" x2="${PX + PW - 32}" y2="${top + 178.5}" stroke="${tok['rule-2']}"/>
<text class="l" x="${PX + 32}" y="${top + 214}" font-size="17">Across every layer</text>
<text class="v" x="${PX + 32}" y="${top + 244}" font-size="20">Security</text>
<text class="i" x="${PX + PW - 32}" y="${top + 244}" font-size="19" text-anchor="end">next</text>`;
  fs.writeFileSync(`${OUT}/stack.svg`, svg(H, 'The stack. Top is furthest from the machine; I am working my way down. AI systems: next. Web, HTML and CSS: learning. Python: solid, the language I am good with and the one I build in. Java: learning. C, the basics: curious. Assembly, the basics: curious. Security, across every layer: next.', ['display', 'body'], b));
}

// Projects: each project an item, its sigil in a square frame like an icon.
{
  const H = 330, X = 56, I = 200, iy = 104, tx = X + I + 40;
  const b = `
<text class="h" x="${X}" y="76" font-size="34">PROJECTS</text>
${frame(X, iy, I, I)}
${asciiSigil('decided', X + I / 2, iy + 18, I - 36, 8)}
<text class="h" x="${tx}" y="${iy + 34}" font-size="28">DECIDED</text>
<text class="i" x="${tx}" y="${iy + 76}" font-size="21">Picks your meals, portions and groceries for a bulk, cut or recomp.</text>
<text class="i" x="${tx}" y="${iy + 104}" font-size="21">You choose the goal, it makes the calls.</text>
<line x1="${tx}" y1="${iy + 136.5}" x2="${W - 56}" y2="${iy + 136.5}" stroke="${tok['rule-2']}"/>
<text class="l" x="${tx}" y="${iy + 166}" font-size="17">Built with</text><text class="v" x="${tx}" y="${iy + 192}" font-size="19">HTML</text>
<text class="l" x="${tx + 130}" y="${iy + 166}" font-size="17">Licence</text><text class="v" x="${tx + 130}" y="${iy + 192}" font-size="19">Open source</text>
<text class="l" x="${tx + 280}" y="${iy + 166}" font-size="17">Sigil</text><text class="m" x="${tx + 280}" y="${iy + 190}" font-size="13">${bytes('decided')}</text>`;
  fs.writeFileSync(`${OUT}/projects.svg`, svg(H, 'Projects. decided: picks your meals, portions and groceries for a bulk, cut or recomp. You choose the goal, it makes the calls. Built with HTML, open source. Its sigil is grown from the bytes of its name.', ['display', 'body', 'mono'], b));
}
console.log('built', fs.readdirSync(OUT).join(', '));
