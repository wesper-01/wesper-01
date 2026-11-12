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
const FONTS = face('Albert Sans', 400, 'albert-sans-latin-400-normal.woff2') + face('Albert Sans', 500, 'albert-sans-latin-500-normal.woff2') + face('Albert Sans', 600, 'albert-sans-latin-600-normal.woff2');
const photo = n => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'tools/photos', n)).toString('base64');
const ARABIC = face('IBM Plex Sans Arabic', 500, 'ibm-plex-sans-arabic-arabic-500-normal.woff2');

const W = 960, X = 4;
// A word that cycles in place: each one shows for loop/n seconds. Without motion, the first stays.
const cycle = (items, x, y, cls, size, loop) => items.map(([w, c], i) => `<text class="${c || cls} cyc${i ? '' : ' first'}" x="${x}" y="${y}" font-size="${size}" style="--loop:${loop}s;--d:${(loop / items.length) * i - 0.01}s;transform-box:fill-box">${w}</text>`).join('');
const svg = (t, H, label, body, arabic = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${FONTS}${arabic ? ARABIC : ''}
text{font-family:"Albert Sans",ui-sans-serif,sans-serif}
.name{font-weight:600;letter-spacing:-0.035em;fill:${t.ink}}
.h{font-weight:600;letter-spacing:-0.02em;fill:${t.ink}}
.b{font-weight:400;fill:${t['ink-2']}}
.l{font-weight:500;fill:${t.muted}}
.v{font-weight:500;fill:${t.ink}}
.ar{font-family:"IBM Plex Sans Arabic",sans-serif;font-weight:500;fill:${t.ink}}
.cyc{opacity:0}.cyc.first{opacity:1}
.cyc{animation:cycle var(--loop) cubic-bezier(.2,.7,.2,1) infinite both;animation-delay:var(--d)}
@keyframes cycle{0%{opacity:0;transform:translateY(8px)}5%,28%{opacity:1;transform:none}33%,100%{opacity:0;transform:translateY(-8px)}}
.pulse{opacity:0;animation:travel 5.2s cubic-bezier(.55,0,.75,1) infinite}
@keyframes travel{0%{opacity:0;transform:translateX(0)}8%{opacity:1}82%{opacity:1}92%,100%{opacity:0;transform:translateX(var(--dist))}}
@media (prefers-reduced-motion: reduce){.cyc,.pulse{animation:none}.cyc{opacity:0}.cyc.first{opacity:1}.pulse{opacity:0}}</style>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
${body}
</svg>`;
const rule = (t, y, x1 = X, x2 = W - X) => `<line x1="${x1}" y1="${y + .5}" x2="${x2}" y2="${y + .5}" stroke="${t.rule}"/>`;

const pages = {
  // Header: a greeting cycling through the four languages I speak, then the name.
  header: t => {
    const H = 330, top = 30;
    const langs = [['ar', 'العربية', 50], ['v', 'Français', 66], ['v', 'English', 58], ['v', 'Español', 62]];
    let lx = 520, speaks = '';
    langs.forEach(([c, w, width]) => { speaks += `<text class="${c}" x="${lx}" y="${top + 270}" font-size="17">${w}</text>`; lx += width + 18; });
    speaks += `<text class="l" x="${lx - 12}" y="${top + 270}" font-size="17">(learning)</text>`;
    const hello = cycle([['Hello'], ['مرحبا', 'l ar'], ['Bonjour'], ['Hola']], X, top + 14, 'l', 20, 12);
    return [H, 'Hello, مرحبا, Bonjour, Hola. Rayane. Engineering student. Python first, working my way down the stack toward systems and security. Based in Guadix, Spain. From Morocco. Speaks Arabic, French, English and Spanish (learning).', `
${hello}
<text class="name" x="${X - 4}" y="${top + 104}" font-size="96">Rayane</text>
<text class="b" x="${X}" y="${top + 152}" font-size="22">Engineering student. Python first, working my way down the stack</text>
<text class="b" x="${X}" y="${top + 182}" font-size="22">toward systems and security.</text>
${rule(t, top + 220)}
<text class="l" x="${X}" y="${top + 246}" font-size="15">Based in</text><text class="v" x="${X}" y="${top + 270}" font-size="17">Guadix, Spain</text>
<text class="l" x="260" y="${top + 246}" font-size="15">From</text><text class="v" x="260" y="${top + 270}" font-size="17">Morocco</text>
<text class="l" x="520" y="${top + 246}" font-size="15">Speaks</text>${speaks}`, true];
  },

  // Stack: one line from high level into the machine, which is a real chip. A pulse runs down it from Python.
  stack: t => {
    const H = 380, ax = 170, P = 220, px = W - X - P, py = ax - P / 2 + 20, x1 = X + 48, x2 = px - 64;
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
    return [H, 'Down the stack, from high level into the machine, shown as a photograph of a silicon chip under a microscope. HTML and CSS: learning. Python: solid. Java: learning. C: curious. Assembly: curious. A small pulse travels from Python down the line into the chip. Next: security, across every layer, and AI systems that keep working when an API fails.', `
<text class="h" x="${X}" y="40" font-size="30">Down the stack</text>
<line x1="${X}" y1="${ax + .5}" x2="${px}" y2="${ax + .5}" stroke="${t.rule}"/>
<circle class="pulse" cx="${pyX}" cy="${ax}" r="3" fill="${t.ink}" style="--dist:${(px - pyX).toFixed(0)}px"/>
${marks}
<image href="${photo('chip.jpg')}" x="${px}" y="${py}" width="${P}" height="${P}" preserveAspectRatio="xMidYMid slice" opacity="${t === THEMES.dark ? 0.82 : 1}"/>
<text class="l" x="${X}" y="${ax + 74}" font-size="15">High level</text>
<text class="l" x="${px}" y="${py + P + 24}" font-size="15">The machine: a silicon chip, 50x</text>
${rule(t, 300, X, px - 28)}
<text class="l" x="${X}" y="${336}" font-size="15">Next</text>
<text class="v" x="160" y="336" font-size="18">Security, across every layer</text>
<text class="v" x="160" y="364" font-size="18">AI systems that keep working when an API fails</text>`];
  },

  // Projects: decided, with the goal it plans for cycling: bulk, cut, recomp.
  projects: t => {
    const H = 300, py = 76, PW = 136, PH = 172, tx = X + PW + 32;
    return [H, 'Projects. decided: picks your meals, portions and groceries. You choose the goal: bulk, cut or recomp, and it makes the calls. Built with HTML, open source. Shown with a photograph of a hand gripping a dumbbell.', `
<text class="h" x="${X}" y="40" font-size="30">Projects</text>
<image href="${photo('dumbbell.jpg')}" x="${X}" y="${py}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMid slice" opacity="${t === THEMES.dark ? 0.85 : 1}"/>
<text class="h" x="${tx}" y="${py + 24}" font-size="22">decided</text>
<text class="b" x="${tx}" y="${py + 58}" font-size="18">Picks your meals, portions and groceries.</text>
<text class="b" x="${tx}" y="${py + 84}" font-size="18">You choose the goal, it makes the calls.</text>
<text class="l" x="${tx}" y="${py + 128}" font-size="15">Goal</text>
${cycle([['bulk'], ['cut'], ['recomp']], tx, py + 166, 'name', 40, 7.5)}
<text class="l" x="${W - X}" y="${py + 24}" font-size="15" text-anchor="end">HTML</text>
<text class="l" x="${W - X}" y="${py + 48}" font-size="15" text-anchor="end">Open source</text>
${rule(t, py + PH + 24)}`];
  },
};

for (const [name, page] of Object.entries(pages))
  for (const [mode, t] of Object.entries(THEMES)) {
    const [H, label, body, arabic] = page(t);
    fs.writeFileSync(path.join(OUT, `${name}-${mode}.svg`), svg(t, H, label, body, arabic));
  }
console.log('built', fs.readdirSync(OUT).join(', '));
