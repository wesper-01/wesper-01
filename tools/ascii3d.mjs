// Ray-traced ASCII: a voxel grid (the word, extruded) seen orthographically, rotated by yaw and pitch.
export function scene(grid, depth) {
  const h = grid.length, w = grid[0].length, vox = new Uint8Array(w * h * depth);
  grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === '1') for (let z = 0; z < depth; z++) vox[(z * h + (h - 1 - y)) * w + x] = 1; }));
  return { vox, w, h, d: depth, at: (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < depth && vox[(z * h + y) * w + x] === 1 };
}
const RAMP = ' .:-=+*%#@';
export function frame(S, cols, rows, yaw, pitch, sx, sy, light = [-0.45, 0.55, -0.7]) {
  const cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
  const inv = (x, y, z) => { const y1 = y * cP + z * sP, z1 = -y * sP + z * cP; return [x * cY - z1 * sY, y1, x * sY + z1 * cY]; };
  const fwd = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cP - z1 * sP, y * sP + z1 * cP]; };
  const n = Math.hypot(...light), L = light.map(a => a / n), D = inv(0, 0, 1), out = [];
  const step = D.map(v => v > 0 ? 1 : -1), tD = D.map(v => Math.abs(1 / (v || 1e-9)));
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const wx = (c - cols / 2 + 0.5) * sx, wy = -(r - rows / 2 + 0.5) * sy;
      let [ox, oy, oz] = inv(wx, wy, -400); ox += S.w / 2; oy += S.h / 2; oz += S.d / 2;
      // advance to the grid's bounding box, then Amanatides-Woo traversal
      let tmin = 0, tmax = 1e9;
      for (const [o, d, lo, hi] of [[ox, D[0], 0, S.w], [oy, D[1], 0, S.h], [oz, D[2], 0, S.d]]) {
        if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) { tmin = 1; tmax = 0; } continue; }
        let a = (lo - o) / d, b = (hi - o) / d; if (a > b) [a, b] = [b, a]; tmin = Math.max(tmin, a); tmax = Math.min(tmax, b);
      }
      if (tmin > tmax) { line += ' '; continue; }
      const t0 = tmin + 1e-6, p = [ox + D[0] * t0, oy + D[1] * t0, oz + D[2] * t0];
      let v = p.map(Math.floor), tM = p.map((q, i) => ((step[i] > 0 ? Math.floor(q) + 1 - q : q - Math.floor(q)) * tD[i]) + t0), face = -1, ch = ' ';
      for (let k = 0; k < 600; k++) {
        if (S.at(v[0], v[1], v[2])) {
          let nrm = [0, 0, 0]; if (face < 0) { // entered through the bbox: pick the axis whose slab is nearest tmin
            const ds = [0, 1, 2].map(i => { const hi = [S.w, S.h, S.d][i]; const a = (0 - [ox, oy, oz][i]) / (D[i] || 1e-9), b = (hi - [ox, oy, oz][i]) / (D[i] || 1e-9); return Math.abs(Math.min(a, b) - tmin); });
            face = ds.indexOf(Math.min(...ds)); }
          nrm[face] = -step[face];
          const wn = fwd(...nrm), lum = Math.max(0, wn[0] * L[0] + wn[1] * L[1] + wn[2] * L[2]);
          ch = RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(0.6 + lum * (RAMP.length - 1.6))))];
          break;
        }
        const i = tM[0] < tM[1] ? (tM[0] < tM[2] ? 0 : 2) : (tM[1] < tM[2] ? 1 : 2);
        if (tM[i] > tmax) break;
        v[i] += step[i]; tM[i] += tD[i]; face = i;
      }
      line += ch;
    }
    out.push(line.replace(/\s+$/, ''));
  }
  return out;
}
