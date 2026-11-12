# Design: wesper

The locked system for this profile. Every image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom (vibe: "quiet, exact, premium, nothing extra")
- Idea: the page disappears into GitHub. Each image is painted on GitHub's own background, in a light and a dark version, so the profile reads as type set on the page, not pictures pasted on it.
- Axes: light and dark/grotesk-sans/neutral, posture: no accent, hierarchy from size, weight and grey alone
- Signature: the stack drawn as one line, from high level to the machine, with each language placed on it and marked by how well I know it.

## Tokens
Light, shown to visitors on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(21% 0.008 260);
  --color-ink-2: oklch(42% 0.01 260);
  --color-muted: oklch(56% 0.01 260);
  --color-rule: oklch(90% 0.004 260);
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
}
```
Shared:
```css
:root {
  --font-display: "Albert Sans", ui-sans-serif, sans-serif;
  --font-body: "Albert Sans", ui-sans-serif, sans-serif;
  --font-arabic: "IBM Plex Sans Arabic", sans-serif; /* the word العربية only */
}
```

## Rules
- One family. Albert Sans 600 for the name and heads, tracked tight (-0.035em on the name, -0.02em on heads); 400 for text at 18px or more; 500 for labels, a step smaller, in `muted`, sentence case, never tracked or capitalised.
- No colour. Ink, a second ink, a muted grey and a hairline. Nothing is highlighted with a hue.
- Hairlines are the only lines; 1px, in `rule`. No boxes, frames, cards, shadows, gradients, glows or rounded panels.
- Content aligns to one left edge. Generous space; nothing is centred.
- On the stack line, a filled circle is solid, a ring is learning, a small dot is curious. The status word is always written beneath, so the mark is never the only signal.
- A language name is written in its own script.
- No emoji, no ASCII art, no middle-dot lists, no em dashes, no eyebrows, no invented numbers, no slogans.

## Pictures
- Two real photographs, each standing for part of my life, never for mood: a silicon chip under a microscope (the machine at the bottom of the stack) and a hand gripping a dumbbell (training, which `decided` is built for).
- Greyscale only, cropped to the subject, square corners, no frame. Dimmed to 82 to 85 percent on the dark theme so they sit in the page.
- Every photograph is credited in the README with its author, licence and source. Kept in `tools/photos/`.

## Motion
- One motion per image, and each one says something true:
  - Header: the greeting above my name cycles through the languages I speak (Hello, مرحبا, Bonjour, Hola), 3 seconds each.
  - Stack: a small pulse runs from Python down the line into the chip, every 5.2 seconds: working my way down.
  - Projects: the goal `decided` plans for cycles: bulk, cut, recomp.
- `transform` and `opacity` only, eased, never bouncing. Under `prefers-reduced-motion: reduce` nothing moves: the first word stays and the pulse is hidden.

## Exports
`assets/{header,stack,projects}-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. Fonts are vendored in `tools/fonts/` (SIL Open Font License) and embedded in each image.
