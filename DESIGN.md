# Design: wesper

The locked system for this profile. Every sheet in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token block below. Change it on purpose; the file is the rule.

## System
- Theme: custom (vibe: "zellige glaze, compiled from bytes, quiet")
- Idea: a Moroccan zellige tile compiled from the bytes of a name. Where I'm from, set in where I'm going.
- Axes: light/grotesk-heavy/chromatic-green · posture: glazed (four glazes on a white glaze ground)
- Signature: the `wesper` tile. The six bytes `77 65 73 70 65 72` fill one octant of a 16 by 16 grid, mirrored eight ways, like a real zellige star.

## Tokens
```css
:root {
  --color-paper: oklch(96.5% 0.008 230);   /* white glaze, cool, never cream */
  --color-ink: oklch(24% 0.03 40);         /* manganese, the dark glaze */
  --color-ink-2: oklch(38% 0.03 40);
  --color-muted: oklch(52% 0.025 40);
  --color-grout: oklch(88% 0.01 230);
  --color-green: oklch(48% 0.11 165);      /* Fez green: solid, links, the Arabic name */
  --color-cobalt: oklch(42% 0.15 262);     /* cobalt: curious */
  --color-ochre: oklch(76% 0.14 75);       /* ochre: learning */
  --font-display: "Rethink Sans", ui-sans-serif, sans-serif;
  --font-body: "Rethink Sans", ui-sans-serif, sans-serif;
  --font-outlier: "Tiny5", monospace;      /* the machine voice: wordmark and bytes only */
  --font-arabic: "Noto Kufi Arabic", sans-serif; /* Kufic is the script zellige carries */
  --radius: 0; --grout: 6px;
}
```

## Rules
- Type: heads in Rethink Sans 800, sentence case, one colour. Body Rethink Sans 400 at 18px or more. Labels 500, sentence case, never tracked or capitalised.
- Tiny5 sets two things only: the wordmark, in capitals (`WESPER`, the one place capitals are allowed), and byte strings. Nothing else is pixel type.
- Arabic is set in Noto Kufi Arabic 700, in green. A language name is always written in its own script.
- Glazes carry meaning, never decoration: green solid, ochre learning, cobalt curious, an ink outline for next. The status word is always written too, so colour is never the only signal.
- Every surface is a tile: square corners, separated by grout (`--grout` of paper), never a shadow, a gradient or a card in a card.
- Every project gets its own tile compiled from the bytes of its name. A tile is data; never draw one by hand.
- No emoji, no middle-dot lists, no em dashes, no eyebrows, no invented numbers.

## Motion
- Still. GitHub serves these as images; nothing moves.

## Exports
`assets/header.svg`, `assets/stack.svg`, `assets/projects.svg`, built by `node tools/build-sheets.mjs`. Fonts are vendored in `tools/fonts/` (SIL Open Font License) and embedded in each sheet.
