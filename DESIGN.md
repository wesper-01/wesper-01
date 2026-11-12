# Design: wesper

The locked system for this profile. The image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom, "Render" (vibe: "demoscene precision, nothing to prove")
- Idea: the name is a real 3D object, ray-traced into ASCII. It is extruded from the letterforms, lit by one key light, and drawn only in characters (` .:-=+*%#@`, dark to bright), swinging slowly in space. Under it, a plain readout of who I am.
- Axes: light and dark/mono/neutral, posture: characters on GitHub's own background
- Signature: the rotating ASCII render of `Rayane`.

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
  --font-mono: "JetBrains Mono", ui-monospace, monospace;  /* everything */
}
```

## The render
- Source: `Rayane` set in Albert Sans 600, rasterized to a 79 by 22 grid (`tools/name-grid.json`, made by `tools/rasterize-name.cjs`), extruded 6 deep into voxels.
- Each character cell casts one orthographic ray (voxel traversal, `tools/ascii3d.mjs`). The face it hits is lit by one light from the upper left front; brightness picks the character.
- 150 columns by 27 rows, sized so it spans the image. Yaw swings ±0.42 rad and pitch breathes around -0.2 rad over 40 frames.
- It is the only graphic. Never a second render, never ASCII borders, banners or decorative text art.

## Rules
- One family, JetBrains Mono, for everything. The readout at 17px, its caption at 14px.
- The readout is label and value: labels in `muted`, values in `ink`, lowercase, one hairline above. It states levels honestly: good, basic, teaching myself.
- No colour. Ink, muted, one hairline.
- One left edge. Nothing centred.
- No projects until there is one worth leading with. No emoji, photos, icons, boxes, middle-dot lists, em dashes, invented numbers or slogans.

## Motion
- The render plays its 40 frames over 6 seconds, looping, frame by frame (`step-end`), so it moves like a real-time renderer.
- The readout fades up 8px once, on load.
- Under `prefers-reduced-motion: reduce`, the render holds its first frame and the readout is simply there.

## Exports
`assets/profile-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. JetBrains Mono is vendored in `tools/fonts/` (SIL Open Font License) and embedded in the image.
