# Design: wesper

The locked system for this profile. Every sheet in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token block below. Change it on purpose; the file is the rule.

## System
- Theme: custom (vibe: "cybersigil, chrome on black, sharp, quiet")
- Idea: a cybersigil grown from the bytes of a name. The mark is data, not a drawing.
- Axes: dark/blackletter/neutral, posture: chrome on black, no colour at all
- Signature: the `wesper` sigil. The six bytes `77 65 73 70 65 72` split into twelve nibbles, and each nibble grows one thorn off a central spine (length, angle, curve and weight from its bits), mirrored left to right.

## Tokens
```css
:root {
  --color-paper: oklch(13% 0.004 270);     /* black, faintly cold */
  --color-paper-2: oklch(17% 0.005 270);
  --color-ink: oklch(95% 0.004 270);       /* chrome white */
  --color-ink-2: oklch(84% 0.004 270);
  --color-muted: oklch(64% 0.006 270);
  --color-rule: oklch(42% 0.006 270);
  --color-chrome-1: oklch(99% 0 0);        /* chrome is a gradient of these four, top to bottom */
  --color-chrome-2: oklch(72% 0.006 270);
  --color-chrome-3: oklch(93% 0.003 270);
  --color-chrome-4: oklch(52% 0.008 270);
  --font-display: "Jacquard 24", serif;    /* blackletter built on a pixel grid */
  --font-body: "Rethink Sans", ui-sans-serif, sans-serif;
  --font-outlier: "Azeret Mono", monospace; /* bytes only */
  --font-arabic: "Noto Kufi Arabic", sans-serif;
  --radius: 0; --gap: 8px;
}
```

## Rules
- No hue anywhere. Black, chrome and greys only. Never a neon accent, never a glow.
- Chrome (the four-stop gradient) is for the sigils and the `wesper` wordmark only. Everything else is flat ink.
- Type: the wordmark and heads in Jacquard 24, lowercase or sentence case, never blackletter capitals in a row (they stop being readable), one colour. Body Rethink Sans 400 at 18px or more. Labels Rethink Sans 500, sentence case, never tracked or capitalised.
- Azeret Mono sets byte strings and nothing else.
- Arabic is set in Noto Kufi Arabic 700. A language name is always written in its own script.
- Status is drawn in line weight, and the status word is always written too: solid is a chrome-white fill, learning a 2px outline, curious a 1px outline, next a dashed 1px outline.
- Square corners, thin lines, nothing soft: no radius, no shadow, no blur, no card in a card.
- Every project gets its own sigil grown from the bytes of its name. A sigil is data; never draw one by hand.
- No emoji, no middle-dot lists, no em dashes, no eyebrows, no invented numbers.

## Motion
- Still. GitHub serves these as images; nothing moves.

## Exports
`assets/header.svg`, `assets/stack.svg`, `assets/projects.svg`, built by `node tools/build-sheets.mjs`. Fonts are vendored in `tools/fonts/` (SIL Open Font License) and embedded in each sheet.
