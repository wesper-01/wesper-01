# Design: wesper

The rules for this profile. The header image in `assets/` is generated from this file by `tools/build-sheets.mjs`, which reads the colour tokens below. Everything else is the README's own text.

## System
- Idea: one piece of craft, then a person talking. The header is the handle rendered in 3D ASCII; below it, plain markdown written the way I'd introduce myself.
- Signature: `wesper` in ice, ray-traced into ASCII characters, with a scan beam that passes over it and shows what is inside.
- Audience: other programmers and employers. Both should finish reading knowing what I'm good at, what I'm learning, and where I'm heading.

## Tokens
Light, shown on GitHub's light theme:
```css
:root {
  --color-paper: #ffffff;                  /* GitHub light background, exactly */
  --color-ink: oklch(19% 0.008 260);
  --color-muted: oklch(50% 0.01 260);       /* 5:1 on white, so the small line passes AA */
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
  --color-muted: oklch(62% 0.012 260);    /* 5:1 on the dark background */
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
- The scan: every 7.5 seconds a single vertical beam crosses the name, left to right, in about 4 seconds, then rests. The 18 columns just behind the beam show the letters' insides: outline cells become edges (`+ - |`) and body cells become the bytes of `wesper` in hex (77 65 73 70 65 72), in `accent`. Ahead of the beam and after it has passed, the name is solid again. It is "how things work underneath" as a picture.
- Nothing else animates on the name: no decode, no flicker, no moving light.
- Under it, one small line: `currently learning` followed by the topic being typed out, held for 1.8 seconds, deleted, and the next one (c++, assembly, reverse engineering). Label in `muted`, topic in `accent`, set at 24px in the 960px image so it is still readable when GitHub shrinks it on a phone. It sits right under the last row of the render, with no empty band between.
- Under `prefers-reduced-motion: reduce` nothing moves: the solid name and the full list of topics are simply there.
- No stat cards, badges, banners, photos or other generated graphics. The header and the trace are the only two images.

## The trace
- Under Now, where the text talks about C++ and assembly: a six-line C++ program that prints `wesper` on the left, the machine code g++ made from it on the right, and a highlight stepping through one instruction at a time, with the source line it came from lit alongside. Registers and `stdout` update with it.
- Everything shown is real. The program is `tools/trace/wesper.cpp`, the listing is objdump's, and the register values come from a gdb recording (`tools/trace/trace.txt`). Nothing is invented or simplified beyond tidying spacing.
- Same tokens as the header: `ink` for code, `muted` for addresses and labels, `accent` for the highlight and the output. One hairline frame, no fills, no rounded corners.
- 0.34 seconds per instruction, a 3.2 second hold on the finished output, then again. Under reduced motion it shows the finished state.
- One caption line under it in small text, saying it is a real run and linking the source.

## The text
- Five short sections under the header, each an `###` heading: About, Now, Stack, Past project, Also. Add or drop a section rather than letting one grow.
- Each section is one or two lines, and says something no other part of the page says: the topics live in the Stack table and the header line, so Now says why and where it leads, not just the list again. The Stack is one three-column table: comfortable, studying in DAM, teaching myself.
- Every section carries an HTML comment saying how to update it; GitHub hides these, so they only show when editing.
- Written by me, in first person or plain fragments, the way I'd say it out loud. Honest levels; never inflate them.
- No real name; the profile goes by the handle.
- One project at most, under Past project, said plainly: what it does, that it is discontinued, and a link to its documentation. No feature lists or numbers.
- No emoji, badges, stat cards, buzzwords, slogans, middle-dot lists, em dashes or invented numbers.

## Exports
`assets/header-{light,dark}.svg` and `assets/trace-{light,dark}.svg`, built by `node tools/build-sheets.mjs` and swapped by the README with `<picture>` and `prefers-color-scheme`. JetBrains Mono is vendored in `tools/fonts/` (SIL Open Font License).
