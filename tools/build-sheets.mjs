// Builds the profile image in assets/ from DESIGN.md, in a light and a dark version.
// Run: node tools/build-sheets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const FONTS = face('Albert Sans', 400, 'albert-sans-latin-400-normal.woff2') + face('Albert Sans', 600, 'albert-sans-latin-600-normal.woff2');

const W = 960, X = 16;
const svg = (t, H, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${FONTS}
text{font-family:"Albert Sans",ui-sans-serif,sans-serif}
.name{font-weight:600;letter-spacing:-0.04em;fill:${t.ink}}
.b{font-weight:400;fill:${t['ink-2']}}
.f{font-weight:400;fill:${t.muted}}
.up{animation:up .9s cubic-bezier(.2,.7,.2,1) backwards}
@keyframes up{from{opacity:0;transform:translateY(12px)}}
@media (prefers-reduced-motion: reduce){.up{animation:none}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${body}
</svg>`;

// The whole profile: the name, one sentence, the facts.
const profile = t => {
  const H = 440;
  const facts = [['Engineering student', X], ['Guadix, Spain. From Morocco', 300], ['Arabic, French, English, Spanish (learning)', 580]];
  return [H, 'Rayane. Good with Python. Teaching myself C, assembly, malware analysis and red teaming. Engineering student. Based in Guadix, Spain, from Morocco. Speaks Arabic, French, English and Spanish (learning). Basic: Java, HTML, CSS.', `
<g class="up"><text class="name" x="${X - 8}" y="170" font-size="168">Rayane</text></g>
<g class="up" style="animation-delay:.12s"><text class="b" x="${X}" y="238" font-size="26">Good with Python. Teaching myself C, assembly,</text>
<text class="b" x="${X}" y="272" font-size="26">malware analysis and red teaming.</text></g>
<g class="up" style="animation-delay:.24s"><line x1="${X}" y1="340.5" x2="${W - X}" y2="340.5" stroke="${t.rule}"/>
${facts.map(([v, x]) => `<text class="f" x="${x}" y="378" font-size="17">${v}</text>`).join('\n')}
<text class="f" x="${X}" y="410" font-size="17">Basic: Java, HTML, CSS</text></g>`];
};

for (const [mode, t] of Object.entries(THEMES)) {
  const [H, label, body] = profile(t);
  fs.writeFileSync(path.join(OUT, `profile-${mode}.svg`), svg(t, H, label, body));
}
console.log('built', fs.readdirSync(OUT).join(', '));
