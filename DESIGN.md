# Design: wesper

The rules for this profile. The header image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the colour tokens below. Everything else is the README's own text.

## System
- Idea: one piece of craft, then a person talking. The header is the handle rendered in 3D ASCII; below it, plain markdown written the way I'd introduce myself.
- Signature: `wesper`, ray-traced into ASCII characters, decoding out of its own bits once when the page loads.
- Audience: other programmers and employers. Both should finish reading knowing what I'm good at, what I'm learning, and where I'm heading.

## Tokens
Light, shown on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(19% 0.008 260);
  --color-muted: oklch(56% 0.01 260);
}
```
Dark, shown on GitHub's dark theme:
```css
[data-theme="dark"] {
  --color-paper: #0d1117;                  /* GitHub dark background, exactly */
  --color-ink: oklch(95% 0.004 260);
  --color-muted: oklch(58% 0.012 260);
}
```

## The header
- `Wesper` set in Albert Sans 600, rasterized to an 86 by 22 grid (`tools/name-grid.json`, made by `tools/rasterize-name.cjs`), extruded 7 deep into voxels, ray-traced one character per cell (`tools/ascii3d.mjs`), lit from the upper front. Characters ` .:-=+*%#@`, dark to bright. JetBrains Mono, embedded.
- A slight fixed angle so the depth shows. It never moves: no spin, no swing, no loop.
- On load it appears as a silhouette of the bits of `wesper` and decodes left to right into its shaded characters over about 1.2 seconds, once, then stays. Under `prefers-reduced-motion: reduce` it is simply there.
- It is the only image. No stat cards, badges, banners, photos or other generated graphics.

## The text
- Written by me, in first person, the way I'd say it out loud. Short paragraphs, plain words.
- Honest levels: comfortable with, know the basics of, learning on my own. Never inflate them.
- No real name; the profile goes by the handle.
- No projects until there is one worth leading with.
- No emoji, buzzwords, slogans, middle-dot lists, em dashes or invented numbers.

## Exports
`assets/header-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. JetBrains Mono is vendored in `tools/fonts/` (SIL Open Font License).
