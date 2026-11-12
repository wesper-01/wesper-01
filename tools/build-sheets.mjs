// Builds the profile images in assets/ from DESIGN.md, in a light and a dark version.
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
const FONTS = face('Michroma', 400, 'michroma-latin-400-normal.woff2') + face('Albert Sans', 400, 'albert-sans-latin-400-normal.woff2') + face('Albert Sans', 500, 'albert-sans-latin-500-normal.woff2');
const ARABIC = face('IBM Plex Sans Arabic', 500, 'ibm-plex-sans-arabic-arabic-500-normal.woff2');

const W = 960, X = 4;
const svg = (t, H, label, body, arabic = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${FONTS}${arabic ? ARABIC : ''}
text{font-family:"Albert Sans",ui-sans-serif,sans-serif}
.name{font-family:"Michroma",sans-serif;letter-spacing:0.16em;fill:${t.ink}}
.h{font-family:"Michroma",sans-serif;letter-spacing:0.14em;fill:${t.ink}}
.b{font-weight:400;fill:${t['ink-2']}}
.l{font-weight:500;fill:${t.muted}}
.v{font-weight:500;fill:${t.ink}}
.ar{font-family:"IBM Plex Sans Arabic",sans-serif;font-weight:500;fill:${t.ink}}
.scan{animation:scan 6s cubic-bezier(.65,0,.35,1) infinite}
@keyframes scan{0%{transform:translateX(var(--from));opacity:0}6%{opacity:1}55%,100%{transform:none;opacity:1}}
.pulse{opacity:0;animation:travel 5.2s cubic-bezier(.55,0,.75,1) infinite}
@keyframes travel{0%{opacity:0;transform:translateX(0)}8%,84%{opacity:1}94%,100%{opacity:0;transform:translateX(var(--dist))}}
@media (prefers-reduced-motion: reduce){.scan,.pulse{animation:none}.pulse{opacity:0}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${body}
</svg>`;
const rule = (t, y, x1 = X, x2 = W - X) => `<line x1="${x1}" y1="${y + .5}" x2="${x2}" y2="${y + .5}" stroke="${t.rule}"/>`;

const pages = {
  // Header: the name, crossed by the red scan line; who I am; where I'm from and what I speak.
  header: t => {
    const H = 318, nameEnd = 452;
    const langs = [['ar', 'العربية', 50], ['v', 'Français', 66], ['v', 'English', 58], ['v', 'Español', 62]];
    let lx = 520, speaks = '';
    langs.forEach(([c, w, width]) => { speaks += `<text class="${c}" x="${lx}" y="288" font-size="17">${w}</text>`; lx += width + 18; });
    speaks += `<text class="l" x="${lx - 12}" y="288" font-size="17">(learning)</text>`;
    return [H, 'RAYANE. Engineering student working down the stack, from Python toward systems and security. Based in Guadix, Spain. From Morocco. Speaks Arabic, French, English and Spanish (learning).', `
<text class="name" x="${X - 4}" y="96" font-size="62">RAYANE</text>
<rect class="scan" x="${nameEnd}" y="42" width="2" height="66" fill="${t.signal}" style="--from:${-nameEnd}px"/>
<rect x="${X}" y="126" width="56" height="2" fill="${t.signal}"/>
<text class="b" x="${X}" y="172" font-size="21">Engineering student working down the stack,</text>
<text class="b" x="${X}" y="200" font-size="21">from Python toward systems and security.</text>
${rule(t, 236)}
<text class="l" x="${X}" y="262" font-size="15">Based in</text><text class="v" x="${X}" y="288" font-size="17">Guadix, Spain</text>
<text class="l" x="260" y="262" font-size="15">From</text><text class="v" x="260" y="288" font-size="17">Morocco</text>
<text class="l" x="520" y="262" font-size="15">Speaks</text>${speaks}`, true];
  },

  // Stack: one line from high level to the machine; the red pulse runs from Python down to Assembly.
  stack: t => {
    const H = 330, ax = 140, x1 = X + 48, x2 = W - X - 48;
    const pts = [['HTML, CSS', 'learning', 0], ['Python', 'solid', 0.24], ['Java', 'learning', 0.46], ['C', 'curious', 0.72], ['Assembly', 'curious', 1]];
    let marks = '', pyX = 0;
    for (const [name, status, at] of pts) {
      const x = x1 + (x2 - x1) * at;
      if (status === 'solid') pyX = x;
      marks += status === 'solid' ? `<circle cx="${x}" cy="${ax}" r="7" fill="${t.ink}"/>`
        : status === 'learning' ? `<circle cx="${x}" cy="${ax}" r="6.25" fill="${t.paper}" stroke="${t.ink}" stroke-width="1.5"/>`
        : `<circle cx="${x}" cy="${ax}" r="3.5" fill="${t.muted}"/>`;
      marks += `<text class="v" x="${x}" y="${ax - 24}" font-size="18" text-anchor="middle">${name}</text>
<text class="l" x="${x}" y="${ax + 34}" font-size="15" text-anchor="middle">${status}</text>`;
    }
    return [H, 'Down the stack, from high level to the machine. HTML and CSS: learning. Python: solid. Java: learning. C: curious. Assembly: curious. A red pulse runs from Python down to Assembly. Next: security, across every layer, and AI systems that keep working when an API fails.', `
<text class="h" x="${X}" y="36" font-size="20">DOWN THE STACK</text>
<line x1="${X}" y1="${ax + .5}" x2="${W - X}" y2="${ax + .5}" stroke="${t.rule}"/>
${marks}
<circle class="pulse" cx="${pyX}" cy="${ax}" r="3.5" fill="${t.signal}" style="--dist:${(x2 - pyX).toFixed(0)}px"/>
<text class="l" x="${X}" y="${ax + 74}" font-size="15">High level</text>
<text class="l" x="${W - X}" y="${ax + 74}" font-size="15" text-anchor="end">Machine</text>
${rule(t, 244)}
<text class="l" x="${X}" y="282" font-size="15">Next</text>
<text class="v" x="160" y="282" font-size="18">Security, across every layer</text>
<text class="v" x="160" y="310" font-size="18">AI systems that keep working when an API fails</text>`];
  },
};

for (const [name, page] of Object.entries(pages))
  for (const [mode, t] of Object.entries(THEMES)) {
    const [H, label, body, arabic] = page(t);
    fs.writeFileSync(path.join(OUT, `${name}-${mode}.svg`), svg(t, H, label, body, arabic));
  }
console.log('built', fs.readdirSync(OUT).join(', '));
