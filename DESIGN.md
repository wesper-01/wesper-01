# Design: wesper

The locked system for this profile. The image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom, "Statement" (vibe: "a name, a sentence, nothing to prove")
- Idea: say it once, at full size. A huge name, one honest sentence, three plain facts. No graphics, no gimmicks; the confidence is in what's left out.
- Axes: light and dark/grotesk-sans/neutral, posture: type on GitHub's own background
- Signature: the name, set huge and tight.

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
}
```

## Rules
- Three sizes, far apart: the name at 168px (600, tracked -0.04em), the sentence at 26px (400), the facts at 17px (400, `muted`). Nothing in between.
- The sentence says what I'm good at and what I'm teaching myself, in my own words. It is the only claim on the page.
- Facts sit in one row of columns under a single hairline. No labels unless a fact needs one.
- No colour, no lines but that one hairline, no graphics, no photos, no icons, no boxes.
- One left edge. Nothing centred.
- No projects until there is one worth leading with. No emoji, ASCII art, middle-dot lists, em dashes, eyebrows, invented numbers or slogans.

## Motion
- One reveal, once, on load: the name, then the sentence, then the facts fade up 12px, 120ms apart. It does not loop.
- `transform` and `opacity` only. Under `prefers-reduced-motion: reduce` everything is simply there.

## Exports
`assets/profile-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. Albert Sans is vendored in `tools/fonts/` (SIL Open Font License) and embedded in the image.
