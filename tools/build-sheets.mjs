// Builds the README's Blueprint sheets as self-contained SVGs (fonts embedded).
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-wesper-01/83c67255-3306-5fd8-b299-dd7ade7c793d/scratchpad/fonts';
const OUT = '/home/user/wesper-01/assets';
fs.mkdirSync(OUT, { recursive: true });
const font = (pkg, file) => fs.readFileSync(`${S}/fontsource-${pkg}-5.3.0/package/files/${file}`).toString('base64');

// oklch -> hex
function oklch(L, C, h, a) {
  const hr = h * Math.PI / 180, A = C * Math.cos(hr), B = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  const g = v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, '0'); };
  return '#' + lin.map(g).join('') + (a !== undefined ? Math.round(a * 255).toString(16).padStart(2, '0') : '');
}
const T = {
  paper: oklch(.35, .105, 256), paper2: oklch(.31, .10, 257), paper3: oklch(.265, .095, 258),
  ink: oklch(.97, .012, 240), ink2: oklch(.90, .025, 242), muted: oklch(.80, .045, 244),
  rule: oklch(.93, .02, 240, .85), rule2: oklch(.93, .02, 240, .32), accentInk: oklch(.33, .105, 256),
};

const style = `
@font-face{font-family:"Chakra Petch";font-weight:600;src:url(data:font/woff2;base64,${font('chakra-petch', 'chakra-petch-latin-600-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:400;src:url(data:font/woff2;base64,${font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:500;src:url(data:font/woff2;base64,${font('ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:500;src:url(data:font/woff2;base64,${font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')}) format("woff2")}
:root{--paper:${T.paper};--paper-2:${T.paper2};--paper-3:${T.paper3};--ink:${T.ink};--ink-2:${T.ink2};--muted:${T.muted};--rule:${T.rule};--rule-2:${T.rule2};--accent-ink:${T.accentInk};
--font-display:"Chakra Petch",ui-sans-serif,sans-serif;--font-body:"IBM Plex Sans",ui-sans-serif,sans-serif;--font-outlier:"IBM Plex Mono",ui-monospace,monospace}
.d{font-family:var(--font-display);font-weight:600;letter-spacing:-0.012em;fill:var(--ink)}
.b{font-family:var(--font-body);font-weight:400;fill:var(--ink-2)}
.l{font-family:var(--font-body);font-weight:500;fill:var(--muted)}
.v{font-family:var(--font-body);font-weight:500;fill:var(--ink)}
.m{font-family:var(--font-outlier);font-weight:500;fill:var(--ink)}
.k{fill:none;stroke:var(--rule);stroke-width:1}
.k2{fill:none;stroke:var(--rule-2);stroke-width:1}
.h{stroke:var(--rule);stroke-width:2}
.hr{stroke:var(--rule);stroke-width:1}
.inv{fill:var(--accent-ink)}`;

const W = 960;
const sheet = (H, title, body, n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
<title>${title}</title>
<style>${style}</style>
<rect width="${W}" height="${H}" style="fill:var(--paper)"/>
<rect class="k" x="20.5" y="20.5" width="${W - 41}" height="${H - 41}"/>
<rect class="k2" x="25.5" y="25.5" width="${W - 51}" height="${H - 51}"/>
${body}
${n ? `<text class="m" x="${W - 52}" y="${H - 44}" font-size="12" text-anchor="end" style="fill:var(--muted)">sheet ${n} of 03</text>` : ''}
</svg>`;

// Sheet 01: the hero and title block
{
  const H = 380, top = 262, x0 = 26, cells = [['Based in', 'Guadix, Spain', 170], ['From', 'Morocco', 130], ['Age', '20', 80], ['Speaks', 'Arabic, French, English, Spanish (learning)', 418]];
  let x = x0, c = '';
  for (const [k, v, w] of cells) {
    c += `<text class="l" x="${x + 20}" y="${top + 30}" font-size="13">${k}</text><text class="v" x="${x + 20}" y="${top + 56}" font-size="16">${v}</text>`;
    x += w; c += `<line class="hr" x1="${x + .5}" y1="${top}" x2="${x + .5}" y2="${H - 26}"/>`;
  }
  c += `<text class="l" x="${x + 20}" y="${top + 30}" font-size="13">Sheet</text><text class="m" x="${x + 20}" y="${top + 56}" font-size="15">01/03</text>`;
  const body = `
<line class="hr" x1="64" y1="68.5" x2="520" y2="68.5"/>
<text class="d" x="60" y="164" font-size="104">RAYANE</text>
<text class="b" x="64" y="214" font-size="22">Engineering student. Python first, working my way down the stack.</text>
<line class="h" x1="26" y1="${top}" x2="${W - 26}" y2="${top}"/>
${c}`;
  fs.writeFileSync(`${OUT}/header.svg`, sheet(H, 'Rayane. Engineering student. Python first, working my way down the stack. Based in Guadix, Spain. From Morocco. Age 20. Speaks Arabic, French, English, Spanish (learning).', body, ''));
}

// Sheet 02: what I am building
{
  const H = 324;
  const body = `
<text class="d" x="60" y="98" font-size="40">NOW BUILDING</text>
<line class="h" x1="60" y1="128" x2="${W - 60}" y2="128"/>
<text class="m" x="60" y="170" font-size="14">P-01</text>
<text class="d" x="150" y="174" font-size="30">decided</text>
<text class="b" x="150" y="210" font-size="18">Picks your meals, portions and groceries for a bulk, cut or recomp.</text>
<text class="b" x="150" y="236" font-size="18">You choose the goal, it makes the calls.</text>
<line class="hr" x1="700.5" y1="148" x2="700.5" y2="244"/>
<text class="l" x="724" y="166" font-size="13">Status</text><text class="v" x="724" y="188" font-size="16">In progress</text>
<text class="l" x="724" y="218" font-size="13">Licence</text><text class="v" x="724" y="240" font-size="16">Open source</text>`;
  fs.writeFileSync(`${OUT}/now.svg`, sheet(H, 'Now building: decided. Picks your meals, portions and groceries for a bulk, cut or recomp. You choose the goal, it makes the calls. In progress, open source.', body, '02'));
}

// Sheet 03: the stack, drawn in section
{
  const rows = [
    ['06', 'AI systems', 'Apps that keep working when an API fails', 'next'],
    ['05', 'Web', 'HTML, CSS', 'learning'],
    ['04', 'High-level', 'Python, what I build with', 'solid'],
    ['03', 'High-level', 'Java', 'learning'],
    ['02', 'Systems', 'C, the basics', 'curious'],
    ['01', 'Machine', 'Assembly, the basics', 'curious'],
  ];
  const X = 60, R = W - 60, top = 196, rh = 58, cols = [X, X + 80, X + 270, X + 640, R - 90, R];
  const secX = cols[4];
  let b = `
<text class="d" x="60" y="98" font-size="40">THE STACK, IN SECTION</text>
<text class="b" x="62" y="136" font-size="18">Top is furthest from the machine. I'm working my way down.</text>
<text class="l" x="${cols[0]}" y="${top - 16}" font-size="13">Level</text>
<text class="l" x="${cols[1]}" y="${top - 16}" font-size="13">Layer</text>
<text class="l" x="${cols[2]}" y="${top - 16}" font-size="13">What I know</text>
<text class="l" x="${cols[3] + 20}" y="${top - 16}" font-size="13">Status</text>
<line class="h" x1="${X}" y1="${top}" x2="${secX - 20}" y2="${top}"/>`;
  rows.forEach(([n, layer, what, status], i) => {
    const y = top + i * rh, hi = status === 'solid', cls = hi ? ' inv' : '';
    if (hi) b += `<rect x="${X}" y="${y}" width="${secX - 20 - X}" height="${rh}" style="fill:var(--ink)"/>`;
    b += `<text class="m${cls}" x="${cols[0] + 4}" y="${y + 36}" font-size="14">${n}</text>
<text class="v${cls}" x="${cols[1]}" y="${y + 36}" font-size="17">${layer}</text>
<text class="b${cls}" x="${cols[2]}" y="${y + 36}" font-size="17">${what}</text>
<line class="hr" x1="${cols[3] + .5}" y1="${y}" x2="${cols[3] + .5}" y2="${y + rh}"/>
<text class="v${cls}" x="${cols[3] + 20}" y="${y + 36}" font-size="17">${status}</text>
<line class="hr" x1="${X}" y1="${y + rh + .5}" x2="${secX - 20}" y2="${y + rh + .5}"/>`;
  });
  const bot = top + rows.length * rh;
  // security spans every layer
  b += `<rect class="k" x="${secX + .5}" y="${top + .5}" width="${R - secX - 1}" height="${bot - top - 1}"/>
<text class="l" x="${secX}" y="${top - 16}" font-size="13">Across all</text>
<text class="v" font-size="17" transform="translate(${secX + 40} ${bot - 22}) rotate(-90)">Security, next</text>
<line class="h" x1="${X}" y1="${bot + 1}" x2="${R}" y2="${bot + 1}"/>`;
  const H = bot + 90;
  fs.writeFileSync(`${OUT}/stack.svg`, sheet(H, 'The stack, in section. Top is furthest from the machine; I am working my way down. AI systems: next. Web, HTML and CSS: learning. Python, what I build with: solid. Java: learning. C, the basics: curious. Assembly, the basics: curious. Security, across every layer: next.', b, '03'));
}
console.log('ok', fs.readdirSync(OUT).map(f => f + ' ' + fs.statSync(`${OUT}/${f}`).size));
