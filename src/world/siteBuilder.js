import * as THREE from 'three';
import { Batch, col } from './batch.js';
import { DATA, groundHeight, streetPath, riverPath, landByName, ROAD_WIDTH } from './geo.js';
import { Path, pointInPoly, polyBounds, rng } from './util.js';
import { SILL } from './buildings.js';
import { SCHEMES } from '../data/sites.js';

const SOIL = col('#43301f');
const EDGE = col('#b9ae98');
const MATERIALS = { stone: col('#cdc2ab'), timber: col('#8a5a3b'), green: col('#2f5a43'), trough: col('#3d584a') };

// ---------------------------------------------------------------------------
// Planting design. Instead of mixing every plant at random, each bed is laid
// out the way a garden designer would plant it:
//   beds       – a low edging row, then bold drifts of one plant each, graded
//                so the tallest plants sit at the back or centre
//   containers – "thriller, filler, spiller": a tall plant in the middle,
//                colour blocks around it, trailing plants over the rim
//   meadows    – natural-looking drifts of each species rather than confetti
// Every slot gets `band` = the index of its plant in the option's scheme.
// ---------------------------------------------------------------------------
function roles(schemeKey) {
  const ps = SCHEMES[schemeKey].plants.map((p, i) => ({ ...p, i }));
  const flowering = ps.filter((p) => p.form !== 'foliage');
  const low = [...(flowering.length ? flowering : ps)].sort((a, b) => a.h - b.h);
  const edge = low[0];
  const spill = ps.find((p) => p.form === 'tiny') || edge;
  const thriller = [...ps].sort((a, b) => b.h - a.h)[0];
  let body = ps.filter((p) => p !== edge).sort((a, b) => a.h - b.h);
  if (!body.length) body = ps;
  let fillers = ps.filter((p) => p !== spill && p !== thriller);
  if (!fillers.length) fillers = ps;
  return { ps, edge, spill, thriller, body, fillers };
}

function pickByShare(list, x) {
  const total = list.reduce((s, p) => s + p.share, 0);
  let acc = 0;
  for (const p of list) { acc += p.share / total; if (x <= acc) return p; }
  return list[list.length - 1];
}

// list: slots in one bed. edgeOf(s): metres to the edge that gets the edging row.
// depthOf(s): 0 (front/edge) … 1 (back/centre) for height grading.
function designBed(list, R, rnd, { edgeOf, depthOf, drift = 1.6, edging = true, edgeBand = 0.42, natural = false, edgePlant }) {
  const edgeP = edgePlant != null ? R.ps[edgePlant] : R.edge;
  const body = edgePlant != null ? R.ps.filter((p) => p !== edgeP).sort((a, b) => a.h - b.h) : R.body;
  if (!list.length) return;
  const n = Math.max(2, Math.round((list.length * 0.12) / (drift * drift)));
  const seeds = [];
  for (let k = 0; k < n; k++) {
    const s = list[Math.floor(rnd() * list.length)];
    let plant;
    if (natural) plant = pickByShare(R.ps, rnd());
    else {
      const d = depthOf(s);
      const idx = Math.max(0, Math.min(body.length - 1, Math.floor(d * body.length + (rnd() - 0.5) * 1.5)));
      plant = body[idx];
    }
    seeds.push({ x: s.x, z: s.z, plant });
  }
  for (const s of list) {
    if (edging && edgeOf(s) < edgeBand) { s.band = edgeP.i; continue; }
    let best = seeds[0], bd = Infinity;
    for (const sd of seeds) {
      const d = (sd.x - s.x) ** 2 + (sd.z - s.z) ** 2;
      if (d < bd) { bd = d; best = sd; }
    }
    s.band = best.plant.i;
  }
}

// t: 0 at the centre of a container … 1 at the rim; a: angle around it
function containerBand(R, t, a, sectors = 6) {
  if (t > 0.74) return R.spill.i;
  if (t < 0.3) return R.thriller.i;
  const k = Math.floor(((a / (Math.PI * 2)) + 1) * sectors) % sectors;
  return R.fillers[k % R.fillers.length].i;
}

// Evenly spaced planting positions (triangular grid) inside a bounding box
function triGrid(b, sp, rnd, fn) {
  const dz = sp * 0.866;
  let row = 0;
  for (let z = b.z0 + dz / 2; z < b.z1; z += dz, row++) {
    for (let x = b.x0 + (row % 2 ? sp / 2 : sp / 4); x < b.x1; x += sp) {
      fn(x + (rnd() - 0.5) * sp * 0.12, z + (rnd() - 0.5) * sp * 0.12);
    }
  }
}

function distToPoly(x, z, pts) {
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, z0] = pts[j], [x1, z1] = pts[i];
    const vx = x1 - x0, vz = z1 - z0, l2 = vx * vx + vz * vz || 1;
    const f = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / l2));
    best = Math.min(best, Math.hypot(x - x0 - vx * f, z - z0 - vz * f));
  }
  return best;
}

// Turns each site's options into (a) structures — soil, planters, posts —
// and (b) flower "slots" that the FlowerField fills with plants.
export function buildSites(sites, town) {
  const fixtures = new Batch();   // lamp columns etc. that stay whichever option is chosen
  const poleSeen = new Set();
  const out = [];
  const occ = town.occ;
  const jobs = [];
  sites.forEach((site, si) => site.options.forEach((option, oi) => jobs.push({ site, option, seed: 1000 + si * 77 + oi * 13 })));

  jobs.forEach(({ site, option, seed }) => {
    const batch = new Batch();
    const r = rng(seed);
    const R = roles(option.scheme);
    const slots = [];
    let area = 0, units = 0;
    const extras = { edging: 0, gravel: 0, benches: 0 };
    const mk = (x, z, y, extra = {}) => ({ x, z, y, r: r(), r2: r(), r3: r(), delay: 0.04 + r() * 0.56, band: -1, ...extra });
    const slot = (x, z, y, extra) => { const s = mk(x, z, y, extra); slots.push(s); return s; };
    // Ground-level planting: skip anything inside a building (or on a path, for plants in grass)
    const groundOk = (x, z, avoidPaths) => { const v = occ.get(x, z); return !(v === 4 || (avoidPaths && v === 1)); };
    const within = (x, z, name) => { const l = name && landByName(name); return !l || pointInPoly(x, z, l.p); };

    for (const sh of option.shapes) {
      switch (sh.kind) {
        case 'poly': {
          const h = sh.raised ?? 0.22;
          const y0 = Math.min(...sh.pts.map(([x, z]) => groundHeight(x, z)));
          extrude(batch, sh.pts, y0 - 0.1, h + 0.1, SOIL);
          extrudeRing(batch, sh.pts, y0 - 0.1, h + (sh.raised ? 0.16 : 0.06), sh.raised ? MATERIALS.stone : EDGE, sh.raised ? 0.25 : 0.12);
          const bed = [];
          triGrid(polyBounds(sh.pts), 0.36, r, (x, z) => { if (pointInPoly(x, z, sh.pts)) bed.push(slot(x, z, y0 + h)); });
          const maxD = Math.max(0.5, ...bed.map((s) => distToPoly(s.x, s.z, sh.pts)));
          const front = sh.front; // optional [x,z] point on the viewing side: tallest plants go away from it
          designBed(bed, R, r, {
            edgeOf: (s) => distToPoly(s.x, s.z, sh.pts),
            depthOf: front ? (s) => Math.min(1, Math.hypot(s.x - front[0], s.z - front[1]) / (sh.depth || 6)) : (s) => distToPoly(s.x, s.z, sh.pts) / maxD,
          });
          area += bed.length * 0.112;
          break;
        }
        case 'circle': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz), h = 0.22;
          batch.cylinder(sh.r + 0.2, h, cx, y0 - 0.02, cz, EDGE, 40);
          batch.cylinder(sh.r, h + 0.04, cx, y0 - 0.02, cz, SOIL, 40);
          const bed = [];
          triGrid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.36, r, (x, z) => { if (Math.hypot(x - cx, z - cz) < sh.r - 0.1) bed.push(slot(x, z, y0 + h)); });
          designBed(bed, R, r, { edgeOf: (s) => sh.r - Math.hypot(s.x - cx, s.z - cz), depthOf: (s) => 1 - Math.hypot(s.x - cx, s.z - cz) / sh.r });
          area += Math.PI * sh.r * sh.r;
          break;
        }
        case 'ring': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz) + 0.1, h = 0.25;
          const s = new THREE.Shape().absarc(0, 0, sh.r1, 0, Math.PI * 2, false);
          s.holes.push(new THREE.Path().absarc(0, 0, sh.r0, 0, Math.PI * 2, true));
          const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 64 });
          g.rotateX(-Math.PI / 2); g.translate(cx, y0, cz);
          batch.add(g, new THREE.Matrix4(), SOIL);
          batch.cylinder(sh.r0, 0.3, cx, y0, cz, col('#7fae55'), 48);
          const bed = [];
          const mid = (sh.r0 + sh.r1) / 2, half = (sh.r1 - sh.r0) / 2;
          triGrid({ x0: cx - sh.r1, x1: cx + sh.r1, z0: cz - sh.r1, z1: cz + sh.r1 }, 0.38, r, (x, z) => {
            const d = Math.hypot(x - cx, z - cz);
            if (d > sh.r0 + 0.1 && d < sh.r1 - 0.1) bed.push(slot(x, z, y0 + h));
          });
          designBed(bed, R, r, { edgeOf: (q) => half - Math.abs(Math.hypot(q.x - cx, q.z - cz) - mid), depthOf: (q) => 1 - Math.abs(Math.hypot(q.x - cx, q.z - cz) - mid) / half, drift: 2.2 });
          area += Math.PI * (sh.r1 ** 2 - sh.r0 ** 2);
          break;
        }
        case 'parterre': {
          // An English garden: four large flower beds, gravel paths between them, a sundial and benches
          const [cx, cz] = sh.c, S = sh.size / 2, a = (sh.rot * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
          const W = (u, v) => [cx + u * ca - v * sa, cz + u * sa + v * ca];
          const y0 = groundHeight(cx, cz);
          const Y = (x, z) => groundHeight(x, z);
          const up = [0, 1, 0];
          const quadW = (pts, y, c) => { const P = pts.map(([u, v]) => { const [x, z] = W(u, v); return [x, y ?? Y(x, z) + 0.07, z]; }); batch.quad(P[0], P[1], P[2], P[3], c, null, up); };
          const GRAVEL = col('#dccfae'), METAL = col('#2b3730'), STONE = col('#d2c8b2');
          // crisp steel edging round each bed
          const edgeRun = (u0, v0, u1, v1) => {
            const [x0, z0] = W(u0, v0), [x1, z1] = W(u1, v1), L = Math.hypot(x1 - x0, z1 - z0);
            if (L < 0.05) return;
            batch.box(L + 0.04, 0.2, 0.05, (x0 + x1) / 2, Y((x0 + x1) / 2, (z0 + z1) / 2) - 0.05, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0), METAL);
            extras.edging += L;
          };
          occ.markRect(cx, cz, sh.size + 2, sh.size + 2, a, 5);
          // gravel over the whole garden floor
          const G = 6, gs = (2 * S) / G;
          for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const u0 = -S + i * gs, v0 = -S + j * gs;
            quadW([[u0, v0], [u0 + gs, v0], [u0 + gs, v0 + gs], [u0, v0 + gs]], null, GRAVEL);
          }
          extras.gravel += (2 * S) ** 2;
          // four beds, each a square with its inner corner cut round the central circle
          const pathHalf = 1.3, inner = S - 2.2, R0 = 5.4, bedArea0 = area;
          for (const [su, sv] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
            const loc = [];
            const t0 = Math.asin(pathHalf / R0), steps = 8;
            loc.push([pathHalf, inner], [inner, inner], [inner, pathHalf]);
            for (let k = 0; k <= steps; k++) {
              const t = t0 + ((Math.PI / 2 - 2 * t0) * k) / steps;
              loc.push([R0 * Math.cos(t), R0 * Math.sin(t)]);
            }
            const bed = loc.map(([u, v]) => W(u * su, v * sv));
            extrude(batch, bed, y0 - 0.1, 0.24, SOIL);
            for (let i = 0; i < bed.length; i++) {
              const [u0, v0] = loc[i], [u1, v1] = loc[(i + 1) % loc.length];
              edgeRun(u0 * su, v0 * sv, u1 * su, v1 * sv);
            }
            const list = [];
            triGrid(polyBounds(bed), 0.42, r, (x, z) => { if (pointInPoly(x, z, bed) && distToPoly(x, z, bed) > 0.15) list.push(slot(x, z, y0 + 0.14, { s: 1.05 })); });
            const maxD = Math.max(0.5, ...list.map((q) => distToPoly(q.x, q.z, bed)));
            designBed(list, R, r, { edgeOf: (q) => distToPoly(q.x, q.z, bed) - 0.15, depthOf: (q) => distToPoly(q.x, q.z, bed) / maxD, drift: 1.5, edgeBand: 0.5, edgePlant: sh.edgePlant ?? 4 });
            area += list.length * 0.42 * 0.42 * 0.866;
          }
          extras.gravel -= area - bedArea0;
          // sundial on a stone plinth, with a ring of benches
          batch.cylinder(0.9, 0.2, cx, y0 + 0.05, cz, STONE, 24);
          batch.cylinder(0.3, 0.9, cx, y0 + 0.25, cz, STONE, 12, 0.24);
          batch.cylinder(0.55, 0.08, cx, y0 + 1.15, cz, STONE, 20);
          batch.box(0.05, 0.3, 0.5, cx, y0 + 1.23, cz, a, METAL);
          for (let k = 0; k < 4; k++) {
            const ang = a + Math.PI / 4 + (k * Math.PI) / 2, rr = 3.3;
            const bx = cx + Math.cos(ang) * rr, bz = cz + Math.sin(ang) * rr;
            const rot = -ang + Math.PI / 2;
            batch.box(1.7, 0.08, 0.5, bx, y0 + 0.45, bz, rot, col('#8a6a4a'));
            batch.box(1.7, 0.45, 0.07, bx + Math.cos(ang) * 0.24, y0 + 0.5, bz + Math.sin(ang) * 0.24, rot, col('#8a6a4a'));
            for (const e of [-0.75, 0.75]) batch.box(0.07, 0.45, 0.5, bx - Math.sin(ang) * e, y0, bz + Math.cos(ang) * e, rot, METAL);
            extras.benches++;
          }
          break;
        }
        case 'carpet': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz), h = 0.3;
          batch.cylinder(sh.r + 0.6, 0.2, cx, y0 - 0.02, cz, MATERIALS.stone, 48);
          batch.cylinder(sh.r, h, cx, y0 - 0.02, cz, SOIL, 48);
          area += Math.PI * sh.r * sh.r;
          const bw = sh.r / sh.bands, order = [...R.ps].sort((a, b) => b.h - a.h);
          triGrid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.3, r, (x, z) => {
            const d = Math.hypot(x - cx, z - cz);
            if (d > sh.r - 0.1) return;
            const th = Math.atan2(z - cz, x - cx);
            let k = Math.min(sh.bands - 1, Math.floor(d / bw));
            // six-pointed star laid across the middle rings
            if (d > sh.r * 0.3 && d < sh.r * 0.8 && Math.cos(th * 6) > 0.6 - (d / sh.r) * 0.4) k = sh.bands; // accent
            const plant = k === sh.bands ? R.spill : d > sh.r - 0.6 ? R.edge : order[k % order.length];
            slot(x, z, y0 + h - 0.02, { band: plant.i, s: 0.9 });
          });
          break;
        }
        case 'border': {
          // Double border either side of a path: edging at the path, tallest at the back
          const curve = new THREE.CatmullRomCurve3(sh.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
          const path = new Path(curve.getSpacedPoints(Math.max(8, Math.round(new Path(sh.pts).length / 2))).map((v) => [v.x, v.z]));
          for (const side of sh.sides === 'one' ? [1] : [1, -1]) {
            const bed = [];
            for (let t = 0.6; t < path.length - 0.6; t += 0.36) {
              const p = path.at(t);
              for (let o = sh.o0 + 0.18; o < sh.o1; o += 0.36 * 0.866) {
                const oo = o + (Math.floor((t / 0.36)) % 2 ? 0.09 : -0.09);
                const x = p.x + p.nx * oo * side, z = p.z + p.nz * oo * side;
                if (!groundOk(x, z, false)) continue;
                bed.push(slot(x, z, groundHeight(x, z) + 0.14, { depth: (oo - sh.o0) / (sh.o1 - sh.o0), edge: Math.min(oo - sh.o0, t, path.length - t) }));
              }
            }
            designBed(bed, R, r, { edgeOf: (s) => s.edge, depthOf: (s) => s.depth, drift: 1.4 });
            soilStrip(batch, path, 0, path.length, side > 0 ? sh.o0 : -sh.o1, side > 0 ? sh.o1 : -sh.o0, occ, 0.14);
            area += bed.length * 0.112;
          }
          break;
        }
        case 'strip': {
          // Native planting along a river or street, in natural drifts
          const path = sh.river ? riverPath() : streetPath(sh.road);
          if (!path) break;
          const from = sh.fromAt ? path.closestT(...sh.fromAt) : sh.from, to = sh.toAt ? path.closestT(...sh.toAt) : sh.to;
          const [t0, t1] = [Math.min(from, to), Math.max(from, to)];
          const sp = 0.5, bed = [];
          for (const s of sh.sides === 'both' ? [1, -1] : [1]) {
            for (let t = t0; t <= t1; t += sp) {
              const p = path.at(t);
              for (let o = sh.o0 + sp / 2; o < sh.o1; o += sp * 0.866) {
                const oo = o + (r() - 0.5) * 0.1, tt = (r() - 0.5) * 0.1;
                const x = p.x + p.nx * oo * s + p.dx * tt, z = p.z + p.nz * oo * s + p.dz * tt;
                if (!groundOk(x, z, true)) continue;
                bed.push(slot(x, z, groundHeight(x, z) + 0.02, { hm: 1.2 }));
              }
            }
          }
          designBed(bed, R, r, { natural: true, edging: false, drift: 2.4, edgeOf: () => 9, depthOf: () => 0 });
          area += bed.length * sp * sp * 0.866;
          break;
        }
        case 'planter': {
          const y0 = groundHeight(sh.x, sh.z) + 0.05, m = MATERIALS[sh.material || 'stone'];
          if (sh.counts !== false) units++;
          batch.cylinder(sh.r, sh.h, sh.x, y0, sh.z, m, 32, sh.r * 1.08);
          batch.cylinder(sh.r * 1.08 + 0.02, 0.08, sh.x, y0 + sh.h - 0.06, sh.z, m, 32);
          batch.cylinder(sh.r * 1.02, sh.h + 0.02, sh.x, y0, sh.z, SOIL, 32);
          area += Math.PI * sh.r * sh.r;
          const top = y0 + sh.h;
          const place = (rad, yTop, sp, extra = {}) => triGrid({ x0: sh.x - rad, x1: sh.x + rad, z0: sh.z - rad, z1: sh.z + rad }, sp, r, (x, z) => {
            const d = Math.hypot(x - sh.x, z - sh.z);
            if (d >= rad - 0.1) return;
            const t = d / rad, a = Math.atan2(z - sh.z, x - sh.x);
            const band = containerBand(R, t, a, sh.tiers ? 8 : 4);
            const spill = band === R.spill.i;
            // trailing plants hang over the rim
            slot(spill ? sh.x + (x - sh.x) * 1.08 : x, spill ? sh.z + (z - sh.z) * 1.08 : z, yTop - (spill ? 0.08 : 0), { band, hm: spill ? 0.7 : 1, ...extra });
          });
          if (sh.tiers) {
            const r2 = sh.r * 0.55, h2 = sh.h * 0.9;
            batch.cylinder(r2, h2, sh.x, top, sh.z, m, 28, r2 * 1.08);
            batch.cylinder(r2 * 1.02, h2 + 0.02, sh.x, top, sh.z, SOIL, 28);
            place(r2, top + h2, 0.28, { hm: 1.25 });
            // lower tier: a ring of colour around the upper tier
            triGrid({ x0: sh.x - sh.r, x1: sh.x + sh.r, z0: sh.z - sh.r, z1: sh.z + sh.r }, 0.28, r, (x, z) => {
              const d = Math.hypot(x - sh.x, z - sh.z);
              if (d < r2 * 1.12 || d > sh.r - 0.1) return;
              const a = Math.atan2(z - sh.z, x - sh.x);
              const rim = d > sh.r - 0.45;
              slot(rim ? sh.x + (x - sh.x) * 1.06 : x, rim ? sh.z + (z - sh.z) * 1.06 : z, top - (rim ? 0.08 : 0), { band: rim ? R.spill.i : R.fillers[Math.floor(((a / (Math.PI * 2)) + 1) * 8) % 2 % R.fillers.length].i });
            });
          } else place(sh.r, top, 0.28);
          break;
        }
        case 'along': {
          const path = streetPath(sh.road);
          if (!path) break;
          const m = MATERIALS[sh.material || 'timber'];
          const to = Math.min(sh.to, path.length - 2);
          for (const s of sh.sides === 'both' ? [1, -1] : [1]) {
            for (let t = sh.from; t <= to; t += sh.every) {
              const p = path.at(t);
              const x = p.x + p.nx * sh.offset * s, z = p.z + p.nz * sh.offset * s;
              const a = Math.atan2(p.dz, p.dx);
              if (!footprintClear(occ, x, z, sh.w, sh.d, a)) continue;
              const y0 = groundHeight(x, z) + 0.04;
              batch.box(sh.w, sh.h, sh.d, x, y0, z, -a, m);
              batch.box(sh.w + 0.1, 0.06, sh.d + 0.1, x, y0 + sh.h - 0.04, z, -a, m);
              batch.box(sh.w - 0.16, sh.h + 0.02, sh.d - 0.16, x, y0, z, -a, SOIL);
              units++;
              area += sh.w * sh.d;
              // thriller down the middle, fillers in blocks, spillers along the long edges
              for (let u = -sh.w / 2 + 0.16; u < sh.w / 2 - 0.1; u += 0.26) for (let v = -sh.d / 2 + 0.14; v < sh.d / 2 - 0.08; v += 0.24) {
                const t2 = Math.max(Math.abs(v) / (sh.d / 2), Math.abs(u) / (sh.w / 2) * 0.9);
                const block = Math.floor((u + sh.w / 2) / (sh.w / 3));
                const band = t2 > 0.7 ? R.spill.i : Math.abs(v) < sh.d * 0.18 && Math.abs(u) < sh.w * 0.3 ? R.thriller.i : R.fillers[block % R.fillers.length].i;
                const vv = band === R.spill.i ? v * 1.1 : v;
                slot(x + p.dx * u + p.nx * vv, z + p.dz * u + p.nz * vv, y0 + sh.h - (band === R.spill.i ? 0.06 : 0), { band });
              }
            }
          }
          break;
        }
        case 'windowboxes': {
          const path = streetPath(sh.road);
          if (!path) break;
          const reach = (ROAD_WIDTH.unclassified / 2) + 9;
          for (const e of town.edges) {
            const mx = (e.A[0] + e.B[0]) / 2, mz = (e.A[1] + e.B[1]) / 2;
            const t = path.closestT(mx, mz);
            if (t < sh.from || t > sh.to) continue;
            const p = path.at(t);
            const tx = p.x - mx, tz = p.z - mz, dist = Math.hypot(tx, tz);
            if (dist > reach || dist < 0.5) continue;
            if ((e.n[0] * tx + e.n[1] * tz) / dist < 0.7) continue; // must face the street
            const floors = Math.floor((e.top - e.base) / 3.2);
            if (floors < 2) continue;
            const ux = (e.B[0] - e.A[0]) / e.L, uz = (e.B[1] - e.A[1]) / e.L, a = Math.atan2(uz, ux);
            for (let k = 1; k < Math.min(floors, 4); k++) {
              const sill = e.base + (k + SILL) * 3.2;
              for (let d = 1.75; d + 0.8 < e.L; d += 3.5) {
                const x = e.A[0] + ux * d + e.n[0] * 0.22, z = e.A[1] + uz * d + e.n[1] * 0.22;
                batch.box(1.5, 0.3, 0.34, x, sill - 0.36, z, -a, MATERIALS.green);
                units++;
                // back row upright fillers, front row trailing
                for (let q = -0.6; q <= 0.61; q += 0.2) {
                  slot(x + ux * q - e.n[0] * 0.06, z + uz * q - e.n[1] * 0.06, sill - 0.06, { band: R.fillers[Math.round((q + 0.6) / 0.4) % R.fillers.length].i, s: 0.7, hm: 0.6 });
                  slot(x + ux * q + e.n[0] * 0.14, z + uz * q + e.n[1] * 0.14, sill - 0.14, { band: R.spill.i, s: 0.66, hm: 0.4 });
                }
              }
            }
          }
          area += units * 0.45;
          break;
        }
        case 'baskets': {
          const path = streetPath(sh.road);
          if (!path) break;
          const pole = col('#23372b');
          for (const s of [1, -1]) {
            for (let t = sh.from; t <= Math.min(sh.to, path.length); t += sh.every) {
              const p = path.at(t);
              const x = p.x + p.nx * sh.offset * s, z = p.z + p.nz * sh.offset * s;
              if (occ.get(x, z) === 4) continue;
              const y0 = groundHeight(x, z);
              const bx = x - p.nx * s * 0.9, bz = z - p.nz * s * 0.9;
              const key = `${Math.round(x)},${Math.round(z)}`;
              if (!poleSeen.has(key)) {
                poleSeen.add(key);
                fixtures.cylinder(0.18, 0.6, x, y0, z, pole, 8, 0.14);
                fixtures.cylinder(0.08, 4.6, x, y0, z, pole, 8, 0.06);
                fixtures.cylinder(0.17, 0.42, x, y0 + 4.6, z, col('#fff4d6'), 6, 0.12);
                fixtures.cylinder(0.25, 0.22, x, y0 + 5.02, z, pole, 6, 0);
                fixtures.box(0.06, 0.06, 1.0, (x + bx) / 2, y0 + 3.95, (z + bz) / 2, Math.atan2(p.nx, p.nz), pole);
              }
              batch.box(0.03, 0.55, 0.03, bx, y0 + 3.4, bz, 0, pole);
              const cy = y0 + 3.05;
              batch.cylinder(0.32, 0.36, bx, cy - 0.3, bz, col('#5d4630'), 12, 0.42);
              units++;
              // a dome of colour on top, a skirt of trailing plants below
              for (let i = 0, N = 70; i < N; i++) {
                const yy = 1 - (i / (N - 1)) * 1.7;
                const rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = i * 2.39996;
                const band = yy > 0.75 ? R.thriller.i : yy > 0.05 ? R.fillers[Math.floor(((th / (Math.PI * 2)) % 1) * 4) % R.fillers.length].i : R.spill.i;
                slot(bx + Math.cos(th) * rr * 0.58, bz + Math.sin(th) * rr * 0.58, cy + yy * 0.46, { band, s: 0.62, hm: 0.18 });
              }
            }
          }
          area += units * 0.6;
          break;
        }
        case 'troughs': {
          for (const br of town.bridges.filter((b) => b.name === sh.bridge)) {
            const L = br.path.length;
            const n = Math.max(1, Math.floor((L - 1) / 3.6));
            for (let k = 0; k < n; k++) {
              const t = (L - n * 3.6) / 2 + 1.8 + k * 3.6;
              const p = br.path.at(t), a = Math.atan2(p.dz, p.dx);
              const y0 = br.y0 + (br.y1 - br.y0) * (t / L) + 0.28 + 0.95;
              for (const s of [1, -1]) {
                const x = p.x + p.nx * (br.width / 2) * s, z = p.z + p.nz * (br.width / 2) * s;
                batch.box(3.2, 0.42, 0.6, x, y0, z, -a, MATERIALS.trough);
                units++;
                area += 3.2 * 0.6;
                for (let u = -1.45; u <= 1.46; u += 0.24) {
                  const block = Math.floor((u + 1.6) / 1.07);
                  slot(x + p.dx * u - p.nx * s * 0.1, z + p.dz * u - p.nz * s * 0.1, y0 + 0.42, { band: R.fillers[block % R.fillers.length].i, s: 0.8, hm: 0.7 });
                  // trailing on both faces of the parapet
                  for (const v of [-0.34, 0.34]) slot(x + p.dx * u + p.nx * v, z + p.dz * u + p.nz * v, y0 + 0.3, { band: R.spill.i, s: 0.72, hm: 0.4 });
                }
              }
            }
          }
          break;
        }
        case 'meadow': {
          const [cx, cz] = sh.c, bed = [];
          triGrid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.5, r, (x, z) => {
            const d = Math.hypot(x - cx, z - cz);
            if (d > sh.r || !within(x, z, sh.within) || !groundOk(x, z, true)) return;
            bed.push(slot(x, z, groundHeight(x, z) + 0.02, { hm: 0.9 }));
          });
          designBed(bed, R, r, { natural: true, edging: false, drift: 2.2, edgeOf: () => 9, depthOf: () => 0 });
          area += bed.length * 0.25 * 0.866;
          break;
        }
        case 'meadowpoly': {
          const b = polyBounds(sh.pts), bed = [];
          triGrid(b, 0.6, r, (x, z) => {
            if (!pointInPoly(x, z, sh.pts) || !within(x, z, sh.within) || !groundOk(x, z, true)) return;
            if (r() > (sh.density ?? 0.85)) return;
            bed.push(slot(x, z, groundHeight(x, z) + 0.02, { hm: 1.1 }));
          });
          designBed(bed, R, r, { natural: true, edging: false, drift: 3, edgeOf: () => 9, depthOf: () => 0 });
          area += bed.length * 0.36 * 0.866 / (sh.density ?? 0.85);
          break;
        }
        case 'pathEdges': {
          // Bulbs or wildflowers lining the footpaths through a park or churchyard
          const land = sh.within && landByName(sh.within);
          const inArea = (x, z) => (land ? pointInPoly(x, z, land.p) : true) && (!sh.near || Math.hypot(x - sh.near[0], z - sh.near[1]) < sh.r);
          const bed = [];
          for (const seg of DATA.segments) {
            if (seg.t !== 'road' || !['footway', 'path', 'pedestrian'].includes(seg.c)) continue;
            if (!seg.p.some(([x, z]) => inArea(x, z))) continue;
            const path = new Path(seg.p);
            for (const s of [1, -1]) {
              for (let t = 0.8; t < path.length - 0.8; t += 0.42) {
                const p = path.at(t);
                for (let o = sh.o0; o < sh.o1; o += 0.42 * 0.866) {
                  const x = p.x + p.nx * o * s + (r() - 0.5) * 0.08, z = p.z + p.nz * o * s + (r() - 0.5) * 0.08;
                  if (!inArea(x, z) || !groundOk(x, z, true)) continue;
                  bed.push(slot(x, z, groundHeight(x, z) + 0.02, { hm: 0.9 }));
                }
              }
            }
          }
          designBed(bed, R, r, { natural: true, edging: false, drift: 2.2, edgeOf: () => 9, depthOf: () => 0 });
          area += bed.length * 0.42 * 0.42 * 0.866;
          break;
        }
        case 'ribbon': {
          // A tapered, curving band along a smoothed centre line, with rows parallel to it
          const curve = new THREE.CatmullRomCurve3(sh.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
          const path = new Path(curve.getSpacedPoints(120).map((v) => [v.x, v.z]));
          const L = path.length, half = sh.width / 2;
          let row = 0;
          for (let o = -half; o <= half + 1e-6; o += sh.spacing, row++) {
            for (let t = 0; t <= L; t += sh.every) {
              const k = Math.sin(Math.PI * (t / L));
              const w = half * Math.pow(k, 0.7) * (0.88 + 0.12 * Math.sin(t / 9 + row * 0.3));
              if (Math.abs(o) > w) continue;
              const p = path.at(t);
              const oo = o + (r() - 0.5) * 0.12, tt = (r() - 0.5) * 0.1;
              const x = p.x + p.nx * oo + p.dx * tt, z = p.z + p.nz * oo + p.dz * tt;
              if (!within(x, z, sh.within) || !groundOk(x, z, true)) continue;
              slot(x, z, groundHeight(x, z), { band: (sh.bands || [0, 1, 2])[row % (sh.bands || [0, 1, 2]).length], s: sh.size ?? 1.85, hm: sh.hm ?? 1 });
              area += sh.spacing * sh.every;
            }
          }
          break;
        }
        case 'frontbeds': {
          // Two raised beds either side of the entrance on the wall facing the street
          const path = streetPath(sh.road);
          let best = null, bd = Infinity;
          for (const e of town.edges) {
            const mx = (e.A[0] + e.B[0]) / 2, mz = (e.A[1] + e.B[1]) / 2;
            const d = Math.hypot(mx - sh.near[0], mz - sh.near[1]);
            if (d > 40 || e.L < 6) continue;
            const p = path.at(path.closestT(mx, mz));
            const tx = p.x - mx, tz = p.z - mz, dist = Math.hypot(tx, tz) || 1;
            if ((e.n[0] * tx + e.n[1] * tz) / dist < 0.6) continue;
            const score = dist + d * 0.3;
            if (score < bd) { bd = score; best = e; }
          }
          if (!best) break;
          const e = best, ux = (e.B[0] - e.A[0]) / e.L, uz = (e.B[1] - e.A[1]) / e.L;
          const mx = (e.A[0] + e.B[0]) / 2, mz = (e.A[1] + e.B[1]) / 2;
          const len = Math.min(e.L * 0.32, 5.5);
          for (const s of [-1, 1]) {
            const c = [mx + ux * s * (len / 2 + 1.4), mz + uz * s * (len / 2 + 1.4)];
            const pts = [[-len / 2, 0.5], [len / 2, 0.5], [len / 2, 1.7], [-len / 2, 1.7]].map(([u, v]) => [c[0] + ux * u + e.n[0] * v, c[1] + uz * u + e.n[1] * v]);
            const y0 = Math.min(...pts.map(([x, z]) => groundHeight(x, z)));
            extrude(batch, pts, y0 - 0.1, 0.55, SOIL);
            extrudeRing(batch, pts, y0 - 0.1, 0.61, MATERIALS.stone, 0.25);
            units++;
            const bed = [];
            triGrid(polyBounds(pts), 0.3, r, (x, z) => { if (pointInPoly(x, z, pts)) bed.push(slot(x, z, y0 + 0.45)); });
            // tallest against the wall, edging at the front
            designBed(bed, R, r, {
              edgeOf: (q) => { const v = (q.x - e.A[0]) * e.n[0] + (q.z - e.A[1]) * e.n[1]; return 1.7 - v; },
              depthOf: (q) => { const v = (q.x - e.A[0]) * e.n[0] + (q.z - e.A[1]) * e.n[1]; return 1 - (v - 0.5) / 1.2; },
              drift: 0.8,
            });
            area += bed.length * 0.078;
          }
          break;
        }
      }
    }
    // Keep trees out of the planting
    for (const s of slots) occ.set(s.x, s.z, 5);
    let cx = 0, cz = 0;
    for (const s of slots) { cx += s.x; cz += s.z; }
    cx /= slots.length || 1; cz /= slots.length || 1;
    let radius = 8;
    for (const s of slots) radius = Math.max(radius, Math.hypot(s.x - cx, s.z - cz));
    const mesh = new THREE.Mesh(batch.build(), MAT);
    mesh.castShadow = mesh.receiveShadow = true;
    out.push({ id: site.id, option: option.id, key: `${site.id}:${option.id}`, slots, mesh, area: Math.round(area), units, extras, center: slots.length ? [cx, cz] : [0, 0], radius });
  });

  const fixturesMesh = new THREE.Mesh(fixtures.build(), MAT);
  fixturesMesh.castShadow = fixturesMesh.receiveShadow = true;
  return { fixtures: fixturesMesh, options: out };
}

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });

function footprintClear(occ, x, z, w, d, a) {
  const c = Math.cos(a), s = Math.sin(a);
  for (const [u, v] of [[0, 0], [-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) {
    if (occ.get(x + u * c - v * s, z + u * s + v * c) === 4) return false;
  }
  return true;
}

// Soil ribbon alongside a path, broken wherever it would run into a building
function soilStrip(batch, path, t0, t1, o0, o1, occ, lift = 0.16) {
  const up = [0, 1, 0];
  for (let t = t0; t < t1; t += 1) {
    const a = path.at(t), b = path.at(Math.min(t1, t + 1));
    const mid = path.at(t + 0.5), om = (o0 + o1) / 2;
    if (occ.get(mid.x + mid.nx * om, mid.z + mid.nz * om) === 4) continue;
    const v = (p, o) => { const x = p.x + p.nx * o, z = p.z + p.nz * o; return [x, groundHeight(x, z) + lift, z]; };
    batch.quad(v(a, o0), v(a, o1), v(b, o1), v(b, o0), SOIL, null, up);
    // crisp edging line on both long sides
    batch.quad(v(a, o0 - 0.08), v(a, o0), v(b, o0), v(b, o0 - 0.08), EDGE, null, up);
    batch.quad(v(a, o1), v(a, o1 + 0.08), v(b, o1 + 0.08), v(b, o1), EDGE, null, up);
  }
}

function shapeOf(pts) {
  return new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
}

function extrude(batch, pts, y, h, color) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  batch.add(g, new THREE.Matrix4(), color);
  g.dispose();
}

// Kerb or edging: a slightly larger outline around a (convex) bed
function extrudeRing(batch, pts, y, h, color, k = 0.25) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const grow = (d) => pts.map(([x, z]) => {
    const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1;
    return [x + (dx / l) * d, z + (dz / l) * d];
  });
  const outer = shapeOf(grow(k));
  const inner = grow(0).map(([x, z]) => new THREE.Vector2(x, -z));
  if (!THREE.ShapeUtils.isClockWise(inner)) inner.reverse();
  outer.holes.push(new THREE.Path(inner));
  const g = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  batch.add(g, new THREE.Matrix4(), color);
  g.dispose();
}
