// Real map data for Hitchin (see scripts/fetch_hitchin.py) plus helpers.
// Coordinates are metres from Market Place: x east, z south.
import DATA from '../data/hitchin.json';
import { Path } from './util.js';

export { DATA };
export const [HALF_W, HALF_H] = DATA.extent;

// ----- Terrain: light blur of the elevation grid, then bilinear lookups -----
const T = DATA.terrain;
const H = (() => {
  const src = T.h, out = new Float32Array(src.length);
  for (let j = 0; j < T.nz; j++) for (let i = 0; i < T.nx; i++) {
    let s = 0, w = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = Math.min(T.nx - 1, Math.max(0, i + di)), jj = Math.min(T.nz - 1, Math.max(0, j + dj));
      const k = di === 0 && dj === 0 ? 4 : di === 0 || dj === 0 ? 2 : 1;
      s += src[jj * T.nx + ii] * k; w += k;
    }
    out[j * T.nx + i] = s / w;
  }
  return out;
})();

export function groundHeight(x, z) {
  const fx = Math.min(T.nx - 1.001, Math.max(0, (x - T.x0) / T.step));
  const fz = Math.min(T.nz - 1.001, Math.max(0, (z - T.z0) / T.step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
  const a = H[j * T.nx + i], b = H[j * T.nx + i + 1], c = H[(j + 1) * T.nx + i], d = H[(j + 1) * T.nx + i + 1];
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

// ----- Street network -----
export const ROAD_WIDTH = {
  trunk: 10, primary: 9, secondary: 8, tertiary: 7.5, unclassified: 6.5, residential: 6, living_street: 5,
  service: 4, pedestrian: 6, track: 3, footway: 1.8, path: 1.6, cycleway: 2, steps: 1.8, bridleway: 2, unknown: 4,
};
export const MAJOR = new Set(['trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street']);

// Join a street's segments into its longest continuous line.
function chain(lines) {
  const segs = lines.map((l) => l.slice());
  const close = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1;
  let best = [], bestLen = 0;
  for (let s = 0; s < segs.length; s++) {
    const used = new Set([s]);
    let c = segs[s].slice(), grew = true;
    while (grew) {
      grew = false;
      segs.forEach((g, i) => {
        if (used.has(i)) return;
        if (close(g[0], c[c.length - 1])) c = c.concat(g.slice(1));
        else if (close(g[g.length - 1], c[c.length - 1])) c = c.concat(g.slice().reverse().slice(1));
        else if (close(g[g.length - 1], c[0])) c = g.slice(0, -1).concat(c);
        else if (close(g[0], c[0])) c = g.slice().reverse().slice(0, -1).concat(c);
        else return;
        used.add(i); grew = true;
      });
    }
    const len = new Path(c).length;
    if (len > bestLen) { best = c; bestLen = len; }
  }
  return best;
}

const byName = new Map();
for (const s of DATA.segments) {
  if (s.t !== 'road' || !s.n) continue;
  if (!byName.has(s.n)) byName.set(s.n, []);
  byName.get(s.n).push(s);
}
const pathCache = new Map();
export function streetPath(name) {
  if (!pathCache.has(name)) {
    const segs = byName.get(name);
    pathCache.set(name, segs ? new Path(chain(segs.map((s) => s.p))) : null);
  }
  return pathCache.get(name);
}
export function streetNames() { return byName; }

export function riverPath() {
  const lines = DATA.water.lines.filter((w) => w.n === 'River Hiz').map((w) => w.p);
  return new Path(chain(lines));
}

export function landByName(name) { return DATA.land.find((l) => l.n === name); }
export function buildingByName(name) { return DATA.buildings.find((b) => b.n === name); }
