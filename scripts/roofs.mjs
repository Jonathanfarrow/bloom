// Adds hipped roofs (straight skeletons) to src/data/hitchin.json.
// Run after fetch_hitchin.py:  node scripts/roofs.mjs
import fs from 'node:fs';
// The library is built for browsers; give it the globals it expects.
globalThis.self = globalThis;
globalThis.window = globalThis;
const { default: pkg } = await import('straight-skeleton');
const { SkeletonBuilder } = pkg;

const file = new URL('../src/data/hitchin.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
await SkeletonBuilder.init();

const SMALL = new Set(['garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'greenhouse', 'kiosk', 'service', 'toilets']);
const area = (p) => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return a / 2; };
let ok = 0, fail = 0, skipped = 0;
const t0 = Date.now();
for (const b of data.buildings) {
  delete b.sk;
  const A = Math.abs(area(b.p));
  // Big sheds, supermarkets and small outbuildings keep flat roofs
  if (A < 20 || A > 2500 || SMALL.has(b.c) || b.r === 'flat') { skipped++; continue; }
  // Library wants counter-clockwise in a y-up frame; our z points south, so flip z.
  let ring = b.p.map(([x, z]) => [x, -z]);
  if (area(ring) > 0) ring.reverse(); // this shoelace form is negative for counter-clockwise rings
  ring = ring.filter((p, i) => { const q = ring[(i + 1) % ring.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05; });
  if (ring.length < 3) { skipped++; continue; }
  let sk = null;
  try { sk = SkeletonBuilder.buildFromPolygon([[...ring, ring[0]]]); } catch { sk = null; }
  if (!sk || !sk.polygons.length) { fail++; continue; }
  b.sk = {
    v: sk.vertices.map(([x, y, t]) => [Math.round(x * 10) / 10, Math.round(-y * 10) / 10, Math.round(t * 100) / 100]),
    f: sk.polygons,
  };
  ok++;
}
fs.writeFileSync(file, JSON.stringify(data));
console.log({ ok, fail, skipped, ms: Date.now() - t0, bytes: fs.statSync(file).size });
