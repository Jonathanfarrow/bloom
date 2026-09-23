import * as THREE from 'three';
import { Batch, col } from './batch.js';
import { groundHeight, streetPath, riverPath, landByName, ROAD_WIDTH } from './geo.js';
import { pointInPoly, polyBounds, rng } from './util.js';
import { SILL } from './buildings.js';

const SOIL = col('#4e3627');
const MATERIALS = { stone: col('#cdc2ab'), timber: col('#8a5a3b'), green: col('#2f5a43'), trough: col('#3d584a') };

// Turns each site's shape list into (a) structures — soil, planters, posts —
// and (b) flower "slots" that the FlowerField fills with plants.
export function buildSites(sites, town) {
  const fixtures = new Batch();   // lamp columns etc. that stay whichever option is chosen
  const poleSeen = new Set();
  const out = [];
  const occ = town.occ;
  const jobs = [];
  sites.forEach((site, si) => site.options.forEach((option, oi) => jobs.push({ site, option, seed: 1000 + si * 77 + oi * 13 })));

  jobs.forEach(({ site, option, seed }) => {
    const si = seed;
    const batch = new Batch();
    const r = rng(seed);
    const slots = [];
    let area = 0, units = 0;
    const slot = (x, z, y, extra = {}) => slots.push({ x, z, y, r: r(), r2: r(), r3: r(), delay: 0.04 + r() * 0.56, band: -1, ...extra });
    // Ground-level planting: skip anything that lands inside a building (or on a path, for meadows)
    const groundSlot = (x, z, y, cell, extra, avoidPaths) => {
      const v = occ.get(x, z);
      if (v === 4 || (avoidPaths && v === 1)) return;
      slot(x, z, y, extra);
      area += cell;
    };
    const grid = (b, sp, fn) => {
      for (let z = b.z0 + sp / 2; z < b.z1; z += sp) for (let x = b.x0 + sp / 2; x < b.x1; x += sp) {
        fn(x + (r() - 0.5) * sp * 0.8, z + (r() - 0.5) * sp * 0.8);
      }
    };
    const within = (x, z, name) => { const l = name && landByName(name); return !l || pointInPoly(x, z, l.p); };

    for (const sh of option.shapes) {
      switch (sh.kind) {
        case 'poly': {
          const h = sh.raised ?? 0.22;
          const y0 = Math.min(...sh.pts.map(([x, z]) => groundHeight(x, z)));
          extrude(batch, sh.pts, y0 - 0.1, h + 0.1, SOIL);
          if (sh.raised) extrudeRing(batch, sh.pts, y0 - 0.1, h + 0.16, MATERIALS.stone);
          grid(polyBounds(sh.pts), 0.34, (x, z) => { if (pointInPoly(x, z, sh.pts)) { slot(x, z, y0 + h); area += 0.1156; } });
          break;
        }
        case 'circle': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz), h = 0.22;
          batch.cylinder(sh.r + 0.25, h, cx, y0 - 0.02, cz, MATERIALS.stone, 32);
          batch.cylinder(sh.r, h + 0.04, cx, y0 - 0.02, cz, SOIL, 32);
          area += Math.PI * sh.r * sh.r;
          grid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.34, (x, z) => {
            if (Math.hypot(x - cx, z - cz) < sh.r - 0.1) slot(x, z, y0 + h);
          });
          break;
        }
        case 'ring': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz) + 0.1, h = 0.25;
          const s = new THREE.Shape().absarc(0, 0, sh.r1, 0, Math.PI * 2, false);
          s.holes.push(new THREE.Path().absarc(0, 0, sh.r0, 0, Math.PI * 2, true));
          const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 48 });
          g.rotateX(-Math.PI / 2); g.translate(cx, y0, cz);
          batch.add(g, new THREE.Matrix4(), SOIL);
          batch.cylinder(sh.r0, 0.3, cx, y0, cz, col('#7fae55'), 32);
          area += Math.PI * (sh.r1 ** 2 - sh.r0 ** 2);
          const bw = (sh.r1 - sh.r0) / 3;
          grid({ x0: cx - sh.r1, x1: cx + sh.r1, z0: cz - sh.r1, z1: cz + sh.r1 }, 0.36, (x, z) => {
            const d = Math.hypot(x - cx, z - cz);
            if (d > sh.r0 + 0.1 && d < sh.r1 - 0.1) slot(x, z, y0 + h, { band: Math.min(2, Math.floor((d - sh.r0) / bw)) });
          });
          break;
        }
        case 'carpet': {
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz), h = 0.3;
          batch.cylinder(sh.r + 0.6, 0.2, cx, y0 - 0.02, cz, MATERIALS.stone, 48);
          batch.cylinder(sh.r, h, cx, y0 - 0.02, cz, SOIL, 48);
          area += Math.PI * sh.r * sh.r;
          const bw = sh.r / sh.bands;
          grid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.32, (x, z) => {
            const d = Math.hypot(x - cx, z - cz);
            if (d > sh.r - 0.1) return;
            const th = Math.atan2(z - cz, x - cx);
            let band = Math.floor(d / bw);
            if (d > sh.r * 0.3 && d < sh.r * 0.8 && Math.cos(th * 6 + d * 0.25) > 0.55) band += 3;
            slot(x, z, y0 + h - 0.02, { band, s: 0.95 });
          });
          break;
        }
        case 'strip': {
          const path = sh.river ? riverPath() : streetPath(sh.road);
          if (!path) break;
          const from = sh.fromAt ? path.closestT(...sh.fromAt) : sh.from, to = sh.toAt ? path.closestT(...sh.toAt) : sh.to;
          const [t0, t1] = [Math.min(from, to), Math.max(from, to)];
          const sides = sh.sides === 'both' ? [1, -1] : [sh.sides === 'right' ? -1 : 1];
          const sp = sh.meadow ? 0.62 : 0.36;
          for (const s of sides) {
            for (let t = t0; t <= t1; t += sp) {
              const p = path.at(t);
              for (let o = sh.o0 + sp / 2; o < sh.o1; o += sp) {
                if (sh.meadow && r() < 0.3) continue;
                const oo = o + (r() - 0.5) * sp * 0.7, tt = (r() - 0.5) * sp * 0.7;
                const x = p.x + p.nx * oo * s + p.dx * tt, z = p.z + p.nz * oo * s + p.dz * tt;
                groundSlot(x, z, groundHeight(x, z) + (sh.meadow ? 0.02 : 0.16), sp * sp, sh.meadow ? { hm: 1.25 } : {}, sh.meadow);
              }
            }
            if (!sh.meadow) soilStrip(batch, path, t0, t1, s > 0 ? sh.o0 : -sh.o1, s > 0 ? sh.o1 : -sh.o0, occ);
          }
          break;
        }
        case 'planter': {
          const y0 = groundHeight(sh.x, sh.z) + 0.05, m = MATERIALS[sh.material || 'stone'];
          if (sh.counts !== false) units++;
          batch.cylinder(sh.r, sh.h, sh.x, y0, sh.z, m, 32, sh.r * 1.08);
          batch.cylinder(sh.r * 1.02, sh.h + 0.02, sh.x, y0, sh.z, SOIL, 32);
          area += Math.PI * sh.r * sh.r;
          const top = y0 + sh.h;
          if (sh.tiers) {
            const r2 = sh.r * 0.55, h2 = sh.h * 0.9;
            batch.cylinder(r2, h2, sh.x, top, sh.z, m, 28, r2 * 1.08);
            batch.cylinder(r2 * 1.02, h2 + 0.02, sh.x, top, sh.z, SOIL, 28);
            grid({ x0: sh.x - r2, x1: sh.x + r2, z0: sh.z - r2, z1: sh.z + r2 }, 0.3, (x, z) => {
              if (Math.hypot(x - sh.x, z - sh.z) < r2 - 0.1) slot(x, z, top + h2, { hm: 1.3 });
            });
          }
          grid({ x0: sh.x - sh.r, x1: sh.x + sh.r, z0: sh.z - sh.r, z1: sh.z + sh.r }, 0.3, (x, z) => {
            const d = Math.hypot(x - sh.x, z - sh.z);
            if (d < sh.r - 0.12 && (!sh.tiers || d > sh.r * 0.55 + 0.1)) slot(x, z, top, {});
          });
          break;
        }
        case 'along': {
          const path = streetPath(sh.road);
          if (!path) break;
          const sides = sh.sides === 'both' ? [1, -1] : [1];
          const m = MATERIALS[sh.material || 'timber'];
          const to = Math.min(sh.to, path.length - 2);
          for (const s of sides) {
            for (let t = sh.from; t <= to; t += sh.every) {
              const p = path.at(t);
              const x = p.x + p.nx * sh.offset * s, z = p.z + p.nz * sh.offset * s;
              const a = Math.atan2(p.dz, p.dx);
              if (!footprintClear(occ, x, z, sh.w, sh.d, a)) continue;
              const y0 = groundHeight(x, z) + 0.04;
              batch.box(sh.w, sh.h, sh.d, x, y0, z, -a, m);
              batch.box(sh.w - 0.16, sh.h + 0.02, sh.d - 0.16, x, y0, z, -a, SOIL);
              units++;
              area += sh.w * sh.d;
              for (let u = -sh.w / 2 + 0.2; u < sh.w / 2 - 0.1; u += 0.3) for (let v = -sh.d / 2 + 0.2; v < sh.d / 2 - 0.1; v += 0.3) {
                slot(x + p.dx * u + p.nx * v, z + p.dz * u + p.nz * v, y0 + sh.h, {});
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
            if (Math.abs(mx - path.pts[0][0]) > path.length + 50 && Math.abs(mz - path.pts[0][1]) > path.length + 50) continue;
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
                for (let q = -0.6; q <= 0.61; q += 0.24) {
                  slot(x + ux * q + e.n[0] * (r() - 0.5) * 0.12, z + uz * q + e.n[1] * (r() - 0.5) * 0.12, sill - 0.06, { s: 0.72, hm: 0.55 });
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
              for (let i = 0, N = 60; i < N; i++) {
                const yy = 1 - (i / (N - 1)) * 1.6;
                const rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = i * 2.39996;
                slot(bx + Math.cos(th) * rr * 0.55, bz + Math.sin(th) * rr * 0.55, cy + yy * 0.44, { s: 0.62, hm: 0.18 });
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
                for (let u = -1.45; u <= 1.46; u += 0.26) for (const v of [-0.14, 0.14]) {
                  slot(x + p.dx * u + p.nx * v, z + p.dz * u + p.nz * v, y0 + 0.42, { s: 0.8, hm: 0.7 });
                }
              }
            }
          }
          break;
        }
        case 'meadow': {
          const [cx, cz] = sh.c;
          grid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.55, (x, z) => {
            const d = Math.hypot(x - cx, z - cz) / sh.r;
            const edge = d + Math.sin(Math.atan2(z - cz, x - cx) * 3 + si) * 0.12;
            if (edge < 1 && r() < 0.95 - edge * edge * 0.8 && within(x, z, sh.within)) groundSlot(x, z, groundHeight(x, z) + 0.02, 0.3025, { hm: 0.9 }, true);
          });
          break;
        }
        case 'meadowpoly': {
          const b = polyBounds(sh.pts), dens = sh.density ?? 0.8;
          grid(b, 0.6, (x, z) => {
            if (r() > dens || !pointInPoly(x, z, sh.pts) || !within(x, z, sh.within)) return;
            groundSlot(x, z, groundHeight(x, z) + 0.02, 0.36 / dens, { hm: 1.1 }, true);
          });
          break;
        }
        case 'rows': {
          const b = polyBounds(sh.pts);
          let row = 0;
          for (let x = b.x0 + 1; x < b.x1; x += sh.spacing, row++) {
            for (let z = b.z0; z < b.z1; z += 0.7) {
              const xx = x + (r() - 0.5) * 0.25, zz = z + (r() - 0.5) * 0.15;
              if (!pointInPoly(xx, zz, sh.pts) || !within(xx, zz, sh.within)) continue;
              groundSlot(xx, zz, groundHeight(xx, zz), sh.spacing * 0.7, { band: row % 3, s: 1.6 }, true);
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
            extrudeRing(batch, pts, y0 - 0.1, 0.61, MATERIALS.stone);
            grid(polyBounds(pts), 0.32, (x, z) => { if (pointInPoly(x, z, pts)) { slot(x, z, y0 + 0.45); area += 0.1; } });
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
    out.push({ id: site.id, option: option.id, key: `${site.id}:${option.id}`, slots, mesh, area: Math.round(area), units, center: slots.length ? [cx, cz] : [0, 0], radius });
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

// Soil ribbon alongside a street, broken wherever it would run into a building
function soilStrip(batch, path, t0, t1, o0, o1, occ) {
  const up = [0, 1, 0];
  for (let t = t0; t < t1; t += 1) {
    const a = path.at(t), b = path.at(Math.min(t1, t + 1));
    const mid = path.at(t + 0.5), om = (o0 + o1) / 2;
    if (occ.get(mid.x + mid.nx * om, mid.z + mid.nz * om) === 4) continue;
    const v = (p, o) => { const x = p.x + p.nx * o, z = p.z + p.nz * o; return [x, groundHeight(x, z) + 0.16, z]; };
    batch.quad(v(a, o0), v(a, o1), v(b, o1), v(b, o0), SOIL, null, up);
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

// Stone kerb: a slightly larger outline around a (convex) bed
function extrudeRing(batch, pts, y, h, color) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const grow = (k) => pts.map(([x, z]) => {
    const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1;
    return [x + (dx / l) * k, z + (dz / l) * k];
  });
  const outer = shapeOf(grow(0.25));
  const inner = grow(0).map(([x, z]) => new THREE.Vector2(x, -z));
  if (!THREE.ShapeUtils.isClockWise(inner)) inner.reverse();
  outer.holes.push(new THREE.Path(inner));
  const g = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  batch.add(g, new THREE.Matrix4(), color);
  g.dispose();
}
