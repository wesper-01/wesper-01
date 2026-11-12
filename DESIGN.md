# Design: wesper

The locked system for this profile. The image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the token blocks below. Change it on purpose; the file is the rule.

## System
- Theme: custom, "Render" (vibe: "demoscene precision, nothing to prove")
- Idea: the handle is a real 3D object, ray-traced into ASCII. It is extruded from the letterforms, lit by one key light, and drawn only in characters (` .:-=+*%#@`, dark to bright), swinging slowly in space. Under it, a plain readout of who I am.
- Axes: light and dark/mono/neutral, posture: characters on GitHub's own background
- Signature: the ASCII render of `Wesper`, decoding out of binary. The profile goes by the handle; no real name appears anywhere.

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
- Source: `Wesper` set in Albert Sans 600, rasterized to an 86 by 22 grid (`tools/name-grid.json`, made by `tools/rasterize-name.cjs`), extruded 7 deep into voxels.
- Each character cell casts one orthographic ray (voxel traversal, `tools/ascii3d.mjs`). The face it hits is lit by one light from the upper front, which travels left to right and back during the hold; brightness picks the character.
- 150 columns by 27 rows, sized so it spans the image.
- Light travel is kept narrow (x from -0.42 to 0.42) so the front faces never go dark.
- It is the only graphic. Never a second render, never ASCII borders, banners or decorative text art.

## Rules
- One family, JetBrains Mono, for everything. The readout at 17px, its caption at 14px.
- The readout comes after the name and is label and value, starting with my role: labels in `muted`, values in `ink`, lowercase, one hairline above. It states levels honestly: good, basic, teaching myself.
- No colour. Ink, muted, one hairline.
- One left edge. Nothing centred.
- No projects until there is one worth leading with. No emoji, photos, icons, boxes, middle-dot lists, em dashes, invented numbers or slogans.

## Motion
- The render never moves; never a spin or a swing. It sits at a slight fixed angle (yaw 0.24, pitch -0.2) so the depth shows. On a 12 second loop, frame by frame: it appears as a silhouette of flickering bits (the bits of `wesper`), a decode sweeps left to right locking each cell into its shaded character over 1.4 seconds, then it holds while the light slowly travels from left to right and back, shifting the shading, and from 10.8 seconds it scrambles back into bits from the right.
- The readout fades up 8px once, on load. Then it runs Matrix-style on a 12 second loop: columns of binary rain fall behind the values (brightest at the head, fading up the tail, 2.4 to 5 seconds a fall); every character starts as a flickering bit and locks into its letter left to right, rows 0.28s apart, with a little scatter. At about 10.6 seconds it scrambles back into bits and decodes again. Every digit on screen is a real bit of the readout's own text.
- Under `prefers-reduced-motion: reduce`, the render holds its first frame and the readout shows as plain text with no rain and no flicker.

## Exports
`assets/profile-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. JetBrains Mono is vendored in `tools/fonts/` (SIL Open Font License) and embedded in the image.
