# Design: wesper

The locked system for this profile. Every image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom, "Signal" (vibe: "sleek, serious, a security console, nothing extra")
- Idea: a quiet console with one signal running through it. Everything is grey and exact; the only colour is a thin red signal line, and it moves.
- Axes: light and dark/geometric-sans (wide)/chromatic-red, posture: no surfaces, type on GitHub's own background
- Signature: the name in wide Michroma capitals, crossed by a red scan line.

## Tokens
Light, shown on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(21% 0.008 260);
  --color-ink-2: oklch(42% 0.01 260);
  --color-muted: oklch(56% 0.01 260);
  --color-rule: oklch(90% 0.004 260);
  --color-signal: oklch(57% 0.2 25);       /* the one colour */
}
```
Dark, shown on GitHub's dark theme:
```css
[data-theme="dark"] {
  --color-paper: #0d1117;                  /* GitHub dark background, exactly */
  --color-ink: oklch(95% 0.004 260);
  --color-ink-2: oklch(77% 0.008 260);
  --color-muted: oklch(60% 0.012 260);
  --color-rule: oklch(30% 0.014 260);
  --color-signal: oklch(64% 0.2 25);
}
```
Shared:
```css
:root {
  --font-display: "Michroma", sans-serif;              /* the name and heads only */
  --font-body: "Albert Sans", ui-sans-serif, sans-serif;
  --font-arabic: "IBM Plex Sans Arabic", sans-serif;   /* the word العربية only */
}
```

## Rules
- Michroma sets the name and the section heads, in capitals, tracked wide (0.16em on the name, 0.14em on heads). Nothing else is Michroma.
- Albert Sans sets everything else: 400 for text at 18px or more, 500 for labels and values, sentence case, never tracked or capitalised.
- One colour, red, used only as the signal: the short line under the name, the scan line, the pulse on the stack. Never on text, never as a fill, never a glow.
- Hairlines are the only other lines; 1px, in `rule`. No boxes, frames, cards, shadows, gradients or photographs.
- One left edge. Nothing centred except labels under their marks.
- On the stack line, a filled circle is good, a ring is basic, a small dot is learning (on my own). The status word is always written beneath.
- A language name is written in its own script.
- No projects until there is one worth leading with. No emoji, ASCII art, sigils, middle-dot lists, em dashes, eyebrows, invented numbers or slogans.

## Motion
- One motion per image, both the signal:
  - Header: the red scan line sweeps through the name, left to right, then rests at its end. Every 6 seconds.
  - Stack: a red pulse runs from Python down the line to Assembly. Every 5.2 seconds: working my way down.
- `transform` and `opacity` only, eased. Under `prefers-reduced-motion: reduce` nothing moves: the scan line rests at the end of the name and the pulse is hidden.

## Exports
`assets/{header,stack}-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. Fonts are vendored in `tools/fonts/` (SIL Open Font License) and embedded in each image.
