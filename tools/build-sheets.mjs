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
const gap = +(design.match(/--gap:\s*(\d+)px/) || [, 8])[1];

function hex(L, C, h) {
  const r = h * Math.PI / 180, A = C * Math.cos(r), B = C * Math.sin(r);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return '#' + [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('');
}

const f = n => fs.readFileSync(path.join(ROOT, 'tools/fonts', n)).toString('base64');
const face = (fam, w, file) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${f(file)}) format("woff2")}`;
const fonts = {
  display: face('Jacquard 24', 400, 'jacquard-24-latin-400-normal.woff2'),
  body: face('Rethink Sans', 400, 'rethink-sans-latin-400-normal.woff2') + face('Rethink Sans', 500, 'rethink-sans-latin-500-normal.woff2') + face('Rethink Sans', 800, 'rethink-sans-latin-800-normal.woff2'),
  mono: face('Azeret Mono', 500, 'azeret-mono-latin-500-normal.woff2'),
  kufi: face('Noto Kufi Arabic', 700, 'noto-kufi-arabic-arabic-700-normal.woff2'),
};
const css = need => `${need.map(n => fonts[n]).join('')}
.h{font-family:"Jacquard 24",serif;font-weight:400;fill:${tok.ink}}
.b{font-family:"Rethink Sans",sans-serif;font-weight:400;fill:${tok['ink-2']}}
.l{font-family:"Rethink Sans",sans-serif;font-weight:500;fill:${tok.muted}}
.v{font-family:"Rethink Sans",sans-serif;font-weight:500;fill:${tok.ink}}
.s{font-family:"Rethink Sans",sans-serif;font-weight:800;fill:${tok.ink}}
.m{font-family:"Azeret Mono",monospace;font-weight:500;fill:${tok.muted}}
.ar{font-family:"Noto Kufi Arabic",sans-serif;font-weight:700;fill:${tok.ink}}`;

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

// The sigil: each nibble of the name grows one thorn off a central spine, mirrored left to right.
function sigil(name, cx, top, H) {
  const nib = [...Buffer.from(name, 'ascii')].flatMap(b => [b >> 4, b & 15]);
  const n = nib.length, p = v => v.toFixed(1);
  // a thin crescent from a base of half-width w to a sharp tip, bent sideways by `bend`
  const blade = (x0, y0, x1, y1, w, bend) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend;
    return `M${p(x0 - nx * w)} ${p(y0 - ny * w)}Q${p(mx - nx * w * 0.6)} ${p(my - ny * w * 0.6)} ${p(x1)} ${p(y1)}Q${p(mx + nx * w * 0.6)} ${p(my + ny * w * 0.6)} ${p(x0 + nx * w)} ${p(y0 + ny * w)}Z`;
  };
  // spine: a long tapered needle, widest just above centre
  let d = `M${p(cx)} ${p(top)}Q${p(cx + 7)} ${p(top + H * 0.45)} ${p(cx)} ${p(top + H)}Q${p(cx - 7)} ${p(top + H * 0.45)} ${p(cx)} ${p(top)}Z`;
  nib.forEach((v, i) => {
    const y = top + H * (0.1 + 0.8 * (i + 0.5) / n);
    const L = H * (0.16 + 0.3 * v / 15);
    const up = v & 1 ? -1 : 1;
    const ang = (12 + 16 * ((v >> 1) & 3)) * Math.PI / 180;
    const bend = (v & 8 ? 1 : -1) * L * 0.22 * up;
    const w = 1.2 + ((v >> 2) & 1) * 1.4;
    const x1 = cx + L * Math.cos(ang), y1 = y + up * L * Math.sin(ang);
    d += blade(cx, y, x1, y1, w, bend) + blade(cx, y, 2 * cx - x1, y1, w, -bend);
  });
  // two hairline arcs, broken where the nibble sum says
  const sum = nib.reduce((a, b) => a + b, 0), r = H * 0.3, g = (sum % 60 + 20) * Math.PI / 180;
  const arc = (a0, a1) => `M${p(cx + r * Math.sin(a0))} ${p(top + H / 2 - r * Math.cos(a0))}A${p(r)} ${p(r)} 0 0 1 ${p(cx + r * Math.sin(a1))} ${p(top + H / 2 - r * Math.cos(a1))}`;
  return `<path d="${d}" fill="url(#chrome)"/>
<path d="${arc(g, Math.PI - g / 2)} ${arc(Math.PI + g / 2, 2 * Math.PI - g)}" fill="none" stroke="url(#chrome)" stroke-width="1"/>`;
}
const bytes = s => [...Buffer.from(s, 'ascii')].map(b => b.toString(16)).join(' ');

// Header: the sigil, the wordmark, the name in two scripts, the languages in their own.
{
  const H = 440, sx = 200, sTop = 70, sH = 300;
  const langs = [['ar', 'العربية', 66], ['v', 'Français', 78], ['v', 'English', 66], ['v', 'Español', 70]];
  let lx = 420, row = '';
  for (const [c, w, width] of langs) { row += `<text class="${c}" x="${lx}" y="${H - 62}" font-size="17">${w}</text>`; lx += width + 24; }
  row += `<text class="l" x="${lx - 18}" y="${H - 62}" font-size="17">(learning)</text>`;
  const body = `
${sigil('wesper', sx, sTop, sH)}
<text class="m" x="${sx}" y="${H - 34}" font-size="14" text-anchor="middle">${bytes('wesper')}</text>
<text class="h" x="414" y="150" font-size="132" style="fill:url(#chrome)">wesper</text>
<text class="s" x="420" y="206" font-size="30">Rayane</text>
<text class="ar" x="${420 + 116}" y="208" font-size="28">ريان</text>
<text class="b" x="420" y="254" font-size="19">Engineering student from Morocco, living in Guadix, Spain.</text>
<text class="b" x="420" y="284" font-size="19">Python first, working my way down the stack.</text>
<line x1="420" y1="${H - 118}" x2="${W - 56}" y2="${H - 118}" stroke="${tok.rule}" stroke-width="1"/>
<text class="l" x="420" y="${H - 92}" font-size="15">Speaks</text>
${row}`;
  fs.writeFileSync(`${OUT}/header.svg`, svg(H, `wesper. Rayane, ريان. Engineering student from Morocco, living in Guadix, Spain. Python first, working my way down the stack. Speaks Arabic, French, English and Spanish (learning). The sigil is grown from the bytes of wesper, ${bytes('wesper')}.`, ['display', 'body', 'mono', 'kufi'], body));
}

// Stack: status drawn in line weight.
{
  const rows = [
    ['AI systems', 'Apps that keep working when an API fails', 'next'],
    ['Web', 'HTML, CSS', 'learning'],
    ['High-level', 'Python, what I build with', 'solid'],
    ['High-level', 'Java', 'learning'],
    ['Systems', 'C, the basics', 'curious'],
    ['Machine', 'Assembly, the basics', 'curious'],
  ];
  const X = 56, R = W - 56, top = 172, rh = 52, secW = 92, bandR = R - secW - gap;
  const box = (x, y, w, h, status) => status === 'solid' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tok.ink}"/>`
    : `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" fill="none" stroke="${status === 'learning' ? tok.ink : tok.muted}" stroke-width="${status === 'learning' ? 2 : 1}"${status === 'next' ? ' stroke-dasharray="6 5"' : ''}/>`;
  let b = `
<text class="h" x="${X}" y="96" font-size="56">Down the stack</text>
<text class="b" x="${X}" y="136" font-size="19">Top is furthest from the machine. I'm working my way down.</text>`;
  rows.forEach(([layer, what, status], i) => {
    const y = top + i * (rh + gap), ink = status === 'solid' ? `style="fill:${tok.paper}"` : '';
    b += box(X, y, bandR - X, rh, status) + `
<text class="v" x="${X + 22}" y="${y + 33}" font-size="18" ${ink}>${layer}</text>
<text class="b" x="${X + 210}" y="${y + 33}" font-size="18" ${ink}>${what}</text>
<text class="s" x="${bandR - 22}" y="${y + 33}" font-size="16" text-anchor="end" ${ink}>${status}</text>`;
  });
  const bot = top + rows.length * (rh + gap) - gap;
  b += box(R - secW, top, secW, bot - top, 'next') + `
<text class="v" font-size="18" transform="translate(${R - secW / 2 + 6} ${bot - 24}) rotate(-90)">Security, every layer</text>
<text class="s" font-size="16" transform="translate(${R - secW / 2 + 6} ${top + 24}) rotate(-90)" text-anchor="end">next</text>`;
  fs.writeFileSync(`${OUT}/stack.svg`, svg(bot + 60, 'Down the stack. Top is furthest from the machine; I am working my way down. AI systems, apps that keep working when an API fails: next. Web, HTML and CSS: learning. Python, what I build with: solid. Java: learning. C, the basics: curious. Assembly, the basics: curious. Security, across every layer: next.', ['display', 'body'], b));
}

// Projects: every project gets its own sigil from the bytes of its name.
{
  const H = 330, X = 56, tx = X + 250;
  const b = `
<text class="h" x="${X}" y="84" font-size="56">Projects</text>
${sigil('decided', X + 100, 112, 190)}
<text class="h" x="${tx}" y="156" font-size="44">decided</text>
<text class="b" x="${tx}" y="196" font-size="19">Picks your meals, portions and groceries for a bulk, cut or recomp.</text>
<text class="b" x="${tx}" y="224" font-size="19">You choose the goal, it makes the calls.</text>
<line x1="${tx}" y1="250" x2="${W - 56}" y2="250" stroke="${tok.rule}" stroke-width="1"/>
<text class="l" x="${tx}" y="276" font-size="15">Built with</text><text class="v" x="${tx}" y="298" font-size="16">HTML</text>
<text class="l" x="${tx + 130}" y="276" font-size="15">Licence</text><text class="v" x="${tx + 130}" y="298" font-size="16">Open source</text>
<text class="l" x="${tx + 280}" y="276" font-size="15">Sigil</text><text class="m" x="${tx + 280}" y="298" font-size="14">${bytes('decided')}</text>`;
  fs.writeFileSync(`${OUT}/projects.svg`, svg(H, 'Projects. decided: picks your meals, portions and groceries for a bulk, cut or recomp. You choose the goal, it makes the calls. Built with HTML, open source. Its sigil is grown from the bytes of its name.', ['display', 'body', 'mono'], b));
}
console.log('built', fs.readdirSync(OUT).join(', '));
