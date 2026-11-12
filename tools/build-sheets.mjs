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
const grout = +(design.match(/--grout:\s*(\d+)px/) || [, 6])[1];

function hex(L, C, h) {
  const r = h * Math.PI / 180, A = C * Math.cos(r), B = C * Math.sin(r);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return '#' + [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('');
}

const f = n => fs.readFileSync(path.join(ROOT, 'tools/fonts', n)).toString('base64');
const face = (fam, w, file) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${f(file)}) format("woff2")}`;
const fonts = {
  body: face('Rethink Sans', 400, 'rethink-sans-latin-400-normal.woff2') + face('Rethink Sans', 500, 'rethink-sans-latin-500-normal.woff2') + face('Rethink Sans', 800, 'rethink-sans-latin-800-normal.woff2'),
  tiny: face('Tiny5', 400, 'tiny5-latin-400-normal.woff2'),
  kufi: face('Noto Kufi Arabic', 700, 'noto-kufi-arabic-arabic-700-normal.woff2'),
};
const css = (need) => `${need.map(n => fonts[n]).join('')}
.h{font-family:"Rethink Sans",sans-serif;font-weight:800;letter-spacing:-0.02em;fill:${tok.ink}}
.b{font-family:"Rethink Sans",sans-serif;font-weight:400;fill:${tok['ink-2']}}
.l{font-family:"Rethink Sans",sans-serif;font-weight:500;fill:${tok.muted}}
.v{font-family:"Rethink Sans",sans-serif;font-weight:500;fill:${tok.ink}}
.t{font-family:"Tiny5",monospace;font-weight:400;fill:${tok.ink}}
.ar{font-family:"Noto Kufi Arabic",sans-serif;font-weight:700;fill:${tok.green}}`;

const W = 960;
const svg = (H, label, need, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${css(need)}</style>
<rect width="${W}" height="${H}" fill="${tok.paper}"/>
${body}
</svg>`;

// The tile: the bytes of a name fill one octant of a 16 x 16 grid, mirrored eight ways.
function tile(name, x, y, size) {
  const bits = [...Buffer.from(name, 'ascii')].flatMap(b => [7, 6, 5, 4, 3, 2, 1, 0].map(i => (b >> i) & 1));
  const N = 16, half = 8, cell = size / N, gap = Math.max(1, size / 150);
  const glaze = r => r <= 1 ? tok.cobalt : r <= 4 ? tok.green : r <= 6 ? tok.ochre : tok.ink;
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${tok.grout}"/>`, k = 0;
  const on = new Map();
  for (let a = 0; a < half; a++) for (let b = a; b < half; b++) on.set(`${a},${b}`, bits[k++ % bits.length]);
  for (let row = 0; row < N; row++) for (let col = 0; col < N; col++) {
    const a = col < half ? half - 1 - col : col - half, b = row < half ? half - 1 - row : row - half;
    const lit = on.get(a <= b ? `${a},${b}` : `${b},${a}`);
    out += `<rect x="${(x + col * cell + gap / 2).toFixed(2)}" y="${(y + row * cell + gap / 2).toFixed(2)}" width="${(cell - gap).toFixed(2)}" height="${(cell - gap).toFixed(2)}" fill="${lit ? glaze(Math.max(a, b)) : tok.paper}"/>`;
  }
  return out;
}
const bytes = s => [...Buffer.from(s, 'ascii')].map(b => b.toString(16)).join(' ');

// Header: the tile, the wordmark, the name in two scripts, the languages in their own.
{
  const H = 420, T = 300, tx = 56, ty = 52;
  const langs = [['ar', 'العربية'], ['v', 'Français'], ['v', 'English'], ['v', 'Español']];
  let lx = 400, row = '';
  for (const [c, w] of langs) {
    const width = c === 'ar' ? 74 : w.length * 9.6;
    row += `<text class="${c}" x="${lx}" y="${H - 58}" font-size="17">${w}</text>`;
    lx += width + 26;
  }
  row += `<text class="l" x="${lx - 18}" y="${H - 58}" font-size="17">(learning)</text>`;
  const body = `
${tile('wesper', tx, ty, T)}
<text class="t" x="${tx}" y="${ty + T + 34}" font-size="20">${bytes('wesper')}</text>
<text class="l" x="${tx + 200}" y="${ty + T + 32}" font-size="15">wesper, as bytes</text>
<text class="t" x="396" y="146" font-size="96">WESPER</text>
<text class="h" x="400" y="210" font-size="34">Rayane</text>
<text class="ar" x="${400 + 132}" y="212" font-size="32">ريان</text>
<text class="b" x="400" y="258" font-size="20">Engineering student from Morocco, living in Guadix, Spain.</text>
<text class="b" x="400" y="288" font-size="20">Python first, working my way down the stack.</text>
<text class="l" x="400" y="${H - 92}" font-size="15">Speaks</text>
${row}`;
  fs.writeFileSync(`${OUT}/header.svg`, svg(H, `wesper. Rayane, ريان. Engineering student from Morocco, living in Guadix, Spain. Python first, working my way down the stack. Speaks Arabic, French, English and Spanish (learning). The tile is the bytes of wesper, ${bytes('wesper')}, mirrored eight ways.`, ['body', 'tiny', 'kufi'], body));
}

// Stack: each layer glazed by status.
{
  const rows = [
    ['AI systems', 'Apps that keep working when an API fails', 'next'],
    ['Web', 'HTML, CSS', 'learning'],
    ['High-level', 'Python, what I build with', 'solid'],
    ['High-level', 'Java', 'learning'],
    ['Systems', 'C, the basics', 'curious'],
    ['Machine', 'Assembly, the basics', 'curious'],
  ];
  const glaze = { solid: [tok.green, tok.paper], learning: [tok.ochre, tok.ink], curious: [tok.cobalt, tok.paper], next: [null, tok.ink] };
  const X = 56, R = W - 56, top = 168, rh = 54, secW = 96, bandR = R - secW - grout;
  let b = `
<text class="h" x="${X}" y="96" font-size="40">Down the stack</text>
<text class="b" x="${X}" y="132" font-size="19">Top is furthest from the machine. I'm working my way down.</text>`;
  rows.forEach(([layer, what, status], i) => {
    const y = top + i * (rh + grout), [fill, ink] = glaze[status];
    b += fill ? `<rect x="${X}" y="${y}" width="${bandR - X}" height="${rh}" fill="${fill}"/>`
      : `<rect x="${X + 1}" y="${y + 1}" width="${bandR - X - 2}" height="${rh - 2}" fill="none" stroke="${tok.ink}" stroke-width="2"/>`;
    b += `<text class="v" x="${X + 22}" y="${y + 34}" font-size="18" style="fill:${ink}">${layer}</text>
<text class="b" x="${X + 210}" y="${y + 34}" font-size="18" style="fill:${ink}">${what}</text>
<text class="h" x="${bandR - 22}" y="${y + 34}" font-size="18" text-anchor="end" style="fill:${ink}">${status}</text>`;
  });
  const bot = top + rows.length * (rh + grout) - grout;
  b += `<rect x="${R - secW + 1}" y="${top + 1}" width="${secW - 2}" height="${bot - top - 2}" fill="none" stroke="${tok.ink}" stroke-width="2"/>
<text class="v" font-size="18" transform="translate(${R - secW / 2 + 6} ${bot - 24}) rotate(-90)">Security, every layer</text>
<text class="h" font-size="18" transform="translate(${R - secW / 2 + 6} ${top + 70}) rotate(-90)" text-anchor="middle">next</text>`;
  const H = bot + 64;
  fs.writeFileSync(`${OUT}/stack.svg`, svg(H, 'Down the stack. Top is furthest from the machine; I am working my way down. AI systems, apps that keep working when an API fails: next. Web, HTML and CSS: learning. Python, what I build with: solid. Java: learning. C, the basics: curious. Assembly, the basics: curious. Security, across every layer: next.', ['body'], b));
}

// Projects: every project gets its own tile from the bytes of its name.
{
  const H = 316, X = 56, T = 168, ty = 76;
  const b = `
<text class="h" x="${X}" y="52" font-size="40" dy="0.2em">Projects</text>
${tile('decided', X, ty + 20, T)}
<text class="h" x="${X + T + 40}" y="${ty + 56}" font-size="32">decided</text>
<text class="b" x="${X + T + 40}" y="${ty + 94}" font-size="19">Picks your meals, portions and groceries for a bulk, cut or recomp.</text>
<text class="b" x="${X + T + 40}" y="${ty + 122}" font-size="19">You choose the goal, it makes the calls.</text>
<text class="l" x="${X + T + 40}" y="${ty + 160}" font-size="15">Built with</text><text class="v" x="${X + T + 40}" y="${ty + 182}" font-size="16">HTML</text>
<text class="l" x="${X + T + 170}" y="${ty + 160}" font-size="15">Licence</text><text class="v" x="${X + T + 170}" y="${ty + 182}" font-size="16">Open source</text>
<text class="l" x="${X + T + 320}" y="${ty + 160}" font-size="15">Tile</text><text class="t" x="${X + T + 320}" y="${ty + 182}" font-size="18">${bytes('decided')}</text>`;
  fs.writeFileSync(`${OUT}/projects.svg`, svg(H, 'Projects. decided: picks your meals, portions and groceries for a bulk, cut or recomp. You choose the goal, it makes the calls. Built with HTML, open source. Its tile is the bytes of its name.', ['body', 'tiny'], b));
}
console.log('built', fs.readdirSync(OUT).join(', '));
