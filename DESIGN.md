# Design: wesper

The locked system for this profile. The image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom, "Statement" (vibe: "a name, a hex dump, nothing to prove")
- Idea: say it once, at full size. A huge name, then the one sentence about me shown the way I'm learning to read files: as an `xxd` hex dump, printing line by line. The ASCII column is the sentence; the bytes are its real bytes.
- Axes: light and dark/grotesk-sans/neutral, posture: type on GitHub's own background
- Signature: the name set huge and tight, over a live hex dump of `about.txt`.

## Tokens
Light, shown on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(19% 0.008 260);
  --color-ink-2: oklch(42% 0.01 260);
  --color-muted: oklch(56% 0.01 260);
  --color-rule: oklch(91% 0.004 260);
}
```
Dark, shown on GitHub's dark theme:
```css
[data-theme="dark"] {
  --color-paper: #0d1117;                  /* GitHub dark background, exactly */
  --color-ink: oklch(95% 0.004 260);
  --color-ink-2: oklch(76% 0.008 260);
  --color-muted: oklch(58% 0.012 260);
  --color-rule: oklch(28% 0.014 260);
}
```
Shared:
```css
:root {
  --font-display: "Albert Sans", ui-sans-serif, sans-serif;
  --font-body: "Albert Sans", ui-sans-serif, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;  /* the hex dump only */
}
```

## Rules
- Three sizes, far apart: the name at 160px (Albert Sans 600, tracked -0.04em), the dump at 17px (JetBrains Mono), the facts at 17px (Albert Sans 400, `muted`).
- The sentence says what I'm good at and what I'm teaching myself, in my own words. It is the only claim on the page, and it appears only inside the dump.
- The dump is real `xxd` output of that sentence: offset in `rule`, hex in `muted`, ASCII in `ink`, sixteen bytes a line. Never fake bytes, never decorative ASCII elsewhere.
- Facts sit in one row of columns under a single hairline. No labels unless a fact needs one.
- No colour, no lines but one hairline under the dump, no graphics, no photos, no icons, no boxes.
- One left edge. Nothing centred.
- No projects until there is one worth leading with. No emoji, ASCII art, middle-dot lists, em dashes, eyebrows, invented numbers or slogans.

## Motion
- On load, the name and the facts fade up 12px, once.
- The dump prints line by line (hex first, its ASCII 0.2s later, 0.45s per line), a block cursor blinks under it, the whole dump holds, clears and prints again every 14 seconds.
- `opacity` and `transform` only. Under `prefers-reduced-motion: reduce` everything is simply there and nothing blinks.

## Exports
`assets/profile-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. Albert Sans and JetBrains Mono are vendored in `tools/fonts/` (SIL Open Font License) and embedded in the image.
