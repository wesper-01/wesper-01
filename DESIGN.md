# Design: wesper

The rules for this profile. The header image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the colour tokens below. Everything else is the README's own text.

## System
- Idea: one piece of craft, then a person talking. The header is the handle rendered in 3D ASCII; below it, plain markdown written the way I'd introduce myself.
- Signature: `wesper` in ice, ray-traced into ASCII characters, decoding out of its own bits when the page loads and staying quietly alive after.
- Audience: other programmers and employers. Both should finish reading knowing what I'm good at, what I'm learning, and where I'm heading.

## Tokens
Light, shown on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(19% 0.008 260);
  --color-muted: oklch(56% 0.01 260);
  /* ice, top of the letters to the bottom: deep navy into bright blue */
  --color-ice-0: #071a33; --color-ice-1: #0c2c58; --color-ice-2: #10407e; --color-ice-3: #1552a0;
  --color-ice-4: #1a64bb; --color-ice-5: #2275cc; --color-ice-6: #2f86da;
  --color-accent: #1f6fc0;                 /* the typed topic */
}
```
Dark, shown on GitHub's dark theme:
```css
[data-theme="dark"] {
  --color-paper: #0d1117;                  /* GitHub dark background, exactly */
  --color-ink: oklch(95% 0.004 260);
  --color-muted: oklch(58% 0.012 260);
  /* ice, top of the letters to the bottom: white-hot into electric blue */
  --color-ice-0: #ffffff; --color-ice-1: #d2f1ff; --color-ice-2: #8fd8f8; --color-ice-3: #52b9ee;
  --color-ice-4: #2b93d8; --color-ice-5: #1d6cb6; --color-ice-6: #164b8a;
  --color-accent: #8fd8f8;                 /* the typed topic */
}
```

## The header
- `Wesper` set in Albert Sans 600, rasterized to an 86 by 22 grid (`tools/name-grid.json`, made by `tools/rasterize-name.cjs`), extruded 7 deep into voxels, ray-traced one character per cell (`tools/ascii3d.mjs`), lit from the upper front. Characters ` .:-=+*%#@`, dark to bright. JetBrains Mono, embedded.
- Colour is ice: one vertical gradient through the seven `ice` tokens, top of the letters to the bottom, so the name reads white-hot (dark) or deep navy (light) at the top and falls into blue. The character density carries the light and shading on top of it. Ice is the only hue on the page.
- A slight fixed angle so the depth shows. The object never moves: no spin, no swing.
- On load it appears as a silhouette of the bits of `wesper` and decodes left to right into its shaded characters over about 1.2 seconds, once.
- After that it stays alive on a 10 second loop: the light drifts left and right across it (x from -0.44 to -0.12, so the faces never dim), shifting the shading, and in about one frame in three a short run of 3 to 8 cells flips to raw bits for a quarter second, then recovers.
- Under it, one small line: `currently learning` followed by the topic being typed out, held for 1.8 seconds, deleted, and the next one (c, assembly, malware analysis, red teaming). Label in `muted`, topic in `accent`.
- Under `prefers-reduced-motion: reduce` nothing moves: the lit name and the full list of topics are simply there.
- It is the only image. No stat cards, badges, banners, photos or other generated graphics.

## The text
- Four short sections under the header, each an `###` heading: About, Now, Stack, Also. Add or drop a section rather than letting one grow.
- Each section is one or two lines. The Stack is one three-column table: comfortable, basics, learning.
- Every section carries an HTML comment saying how to update it; GitHub hides these, so they only show when editing.
- Written by me, in first person or plain fragments, the way I'd say it out loud. Honest levels; never inflate them.
- No real name; the profile goes by the handle.
- No projects until there is one worth leading with.
- No emoji, badges, stat cards, buzzwords, slogans, middle-dot lists, em dashes or invented numbers.

## Exports
`assets/header-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. JetBrains Mono is vendored in `tools/fonts/` (SIL Open Font License).
