# Design: wesper

The locked system for this profile. Every sheet in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token block below. Change it on purpose; the file is the rule.

## System
- Theme: custom (vibe: "cybersigil relic, retro dark fantasy menu")
- Idea: a cold chrome sigil grown from the bytes of a name, kept in a warm, ash-dark menu like an old dark-fantasy game. The future, set in ruins.
- Axes: dark/roman-serif/warm, posture: ash ground, bone ink, one ember light
- Signature: the `wesper` sigil, drawn in ASCII. The six bytes `77 65 73 70 65 72` split into twelve nibbles; each grows one thorn off a central spine (length, angle and curve from its bits), mirrored left to right. Every stroke is sampled onto a character grid and each cell takes the character for the stroke's direction there: `-` `\` `|` `/`, with `.` at the tips.

## Tokens
```css
:root {
  --color-paper: oklch(11% 0.006 60);      /* ash black */
  --color-paper-2: oklch(15.5% 0.009 60);  /* a selected row, a lit panel */
  --color-ink: oklch(90% 0.02 80);         /* bone */
  --color-ink-2: oklch(78% 0.02 80);
  --color-muted: oklch(58% 0.015 70);
  --color-rule: oklch(42% 0.02 70);        /* frame line */
  --color-rule-2: oklch(26% 0.014 70);     /* inner frame line, row hairlines */
  --color-ember: oklch(72% 0.14 62);       /* the one warm light */
  --color-chrome-1: oklch(99% 0 0);        /* chrome is a gradient of these four, top to bottom */
  --color-chrome-2: oklch(70% 0.006 260);
  --color-chrome-3: oklch(93% 0.003 260);
  --color-chrome-4: oklch(48% 0.008 260);
  --font-display: "Cinzel", serif;
  --font-body: "EB Garamond", serif;
  --font-outlier: "Azeret Mono", monospace; /* bytes and ASCII sigils only */
  --font-arabic: "Amiri", serif;            /* the word العربية only */
  --radius: 0;
}
```

## Rules
- Cold against warm: chrome belongs to the sigils and the `WESPER` wordmark, and nothing else. Ember is the one light: the selection cursor, the selected status, the diamond in a divider. Everything else is bone on ash.
- Type: heads in Cinzel 600, capitals (Cinzel has no lowercase), tracked 0.08em; the wordmark tracked 0.2em. Body in EB Garamond 400 at 19px or more; lore lines and status words in its italic. Labels in EB Garamond 500, sentence case, never tracked.
- Azeret Mono sets byte strings and the ASCII sigils, nothing else. ASCII is for sigils; never ASCII borders, banners or text art. Amiri sets العربية and nothing else. A language name is always written in its own script.
- Every panel is a menu frame: a 1px `rule` line, a 1px `rule-2` line 4px inside, and a small diamond on each outer corner. Square corners, no shadow, no blur, never a card in a card.
- The stack is a menu: one row selected (the thing I'm solid in), its description in the panel beside it. The status word is always written, so colour is never the only signal.
- Every project gets its own sigil grown from the bytes of its name, shown in a square frame like an item icon. A sigil is data, always rendered in ASCII by the generator; never draw or type one by hand.
- Never a glow, a gradient on a surface, an invented stat or level, or an emoji. No middle-dot lists, no em dashes, no eyebrows.
- Inspired by a genre, never copied from a game: no names, phrases, icons or layouts lifted from one.

## Motion
- Still. GitHub serves these as images; nothing moves.

## Exports
`assets/header.svg`, `assets/stack.svg`, `assets/projects.svg`, built by `node tools/build-sheets.mjs`. Fonts are vendored in `tools/fonts/` (SIL Open Font License) and embedded in each sheet.
