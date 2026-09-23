import * as THREE from 'three';
import { RIVER } from '../data/town.js';
import { Batch, col } from './batch.js';
import { ribbon } from './ground.js';
import { groundHeight, Path, pointInPoly, polyArea, polyBounds, rng } from './util.js';

const SOIL = col('#4e3627');
const MATERIALS = { stone: col('#cdc2ab'), timber: col('#8a5a3b'), green: col('#2f5a43'), trough: col('#3d584a') };

// Turns each site's shape list into (a) static structures — soil, planters,
// posts — and (b) flower "slots" that the FlowerField fills with plants.
export function buildSites(sites, town) {
  const batch = new Batch();
  const out = [];
  const riverPath = new Path(RIVER.pts);

  sites.forEach((site, si) => {
    const r = rng(1000 + si * 77);
    const slots = [];
    let area = 0, units = 0;
    const slot = (x, z, y, extra = {}) => slots.push({ x, z, y, r: r(), r2: r(), r3: r(), delay: 0.04 + r() * 0.56, band: -1, ...extra });
    const grid = (b, sp, fn) => {
      for (let z = b.z0 + sp / 2; z < b.z1; z += sp) for (let x = b.x0 + sp / 2; x < b.x1; x += sp) {
        fn(x + (r() - 0.5) * sp * 0.8, z + (r() - 0.5) * sp * 0.8);
      }
    };

    for (const sh of site.shapes) {
      switch (sh.kind) {
        case 'poly': {
          const h = sh.raised ?? 0.22;
          const y0 = Math.min(...sh.pts.map(([x, z]) => groundHeight(x, z)));
          extrude(batch, sh.pts, y0 - 0.1, h + 0.1, SOIL);
          if (sh.raised) extrudeRing(batch, sh.pts, y0 - 0.1, h + 0.16, MATERIALS.stone);
          area += polyArea(sh.pts);
          grid(polyBounds(sh.pts), 0.34, (x, z) => { if (pointInPoly(x, z, sh.pts)) slot(x, z, y0 + h); });
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
          const [cx, cz] = sh.c, y0 = groundHeight(cx, cz) + 0.15, h = 0.25;
          const s = new THREE.Shape().absarc(0, 0, sh.r1, 0, Math.PI * 2, false);
          s.holes.push(new THREE.Path().absarc(0, 0, sh.r0, 0, Math.PI * 2, true));
          const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 48 });
          g.rotateX(-Math.PI / 2); g.translate(cx, y0, cz);
          batch.add(g, new THREE.Matrix4(), SOIL);
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
          // Four paths leading to the bed
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            batch.box(2.2, 0.08, 16, cx + Math.cos(a) * (sh.r + 8.6), y0, cz + Math.sin(a) * (sh.r + 8.6), -a + Math.PI / 2, col('#d6c9ad'));
          }
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
          const path = sh.river ? riverPath : town.roadPaths.get(sh.road);
          const sides = sh.sides === 'both' ? [1, -1] : [sh.sides === 'right' ? -1 : 1];
          const sp = sh.meadow ? 0.62 : 0.36;
          for (const s of sides) {
            if (!sh.meadow) {
              const pts = [];
              for (let t = sh.from; t <= sh.to; t += 4) { const p = path.at(t); pts.push([p.x, p.z]); }
              const [o0, o1] = s > 0 ? [sh.o0, sh.o1] : [-sh.o1, -sh.o0];
              ribbon(batch, pts, o0, o1, 0.2, SOIL);
            }
            for (let t = sh.from; t <= sh.to; t += sp) {
              const p = path.at(t);
              for (let o = sh.o0 + sp / 2; o < sh.o1; o += sp) {
                if (sh.meadow && r() < 0.35) continue;
                const oo = o + (r() - 0.5) * sp * 0.7, tt = (r() - 0.5) * sp * 0.7;
                const x = p.x + p.nx * oo * s + p.dx * tt, z = p.z + p.nz * oo * s + p.dz * tt;
                slot(x, z, groundHeight(x, z) + (sh.meadow ? 0.02 : 0.2), sh.meadow ? { hm: 1.25 } : {});
              }
            }
            area += (sh.to - sh.from) * (sh.o1 - sh.o0);
          }
          break;
        }
        case 'planter': {
          const y0 = groundHeight(sh.x, sh.z) + 0.1, m = MATERIALS[sh.material || 'stone'];
          units++;
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
          const path = town.roadPaths.get(sh.road);
          const sides = sh.sides === 'both' ? [1, -1] : [1];
          const m = MATERIALS[sh.material || 'timber'];
          for (const s of sides) {
            for (let t = sh.from; t <= sh.to; t += sh.every) {
              const p = path.at(t);
              const x = p.x + p.nx * sh.offset * s, z = p.z + p.nz * sh.offset * s;
              const a = Math.atan2(p.dz, p.dx), y0 = groundHeight(x, z) + 0.06;
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
          const list = (town.fronts.get(sh.road) || []).filter((f) => f.t >= sh.from && f.t <= sh.to);
          for (const f of list) {
            const dx = f.B[0] - f.A[0], dz = f.B[2] - f.A[2], L = Math.hypot(dx, dz);
            const ux = dx / L, uz = dz / L, a = Math.atan2(uz, ux);
            for (let k = 1; k < f.floors; k++) {
              const sill = f.base + (k + 0.3) * 3.2;
              for (let d = 1.75; d + 0.8 < L; d += 3.5) {
                const x = f.A[0] + ux * d + f.normal[0] * 0.24, z = f.A[2] + uz * d + f.normal[2] * 0.24;
                batch.box(1.5, 0.3, 0.34, x, sill - 0.36, z, -a, MATERIALS.green);
                units++;
                for (let q = -0.6; q <= 0.61; q += 0.24) {
                  slot(x + ux * q + f.normal[0] * (r() - 0.5) * 0.12, z + uz * q + f.normal[2] * (r() - 0.5) * 0.12, sill - 0.06, { s: 0.72, hm: 0.55 });
                }
              }
            }
          }
          area += units * 0.45;
          break;
        }
        case 'baskets': {
          const path = town.roadPaths.get(sh.road);
          const pole = col('#23372b');
          for (const s of [1, -1]) {
            for (let t = sh.from; t <= sh.to; t += sh.every) {
              const p = path.at(t);
              const x = p.x + p.nx * sh.offset * s, z = p.z + p.nz * sh.offset * s, y0 = groundHeight(x, z);
              batch.cylinder(0.09, 4.4, x, y0, z, pole, 8, 0.07);
              batch.cylinder(0.22, 0.5, x, y0 + 4.4, z, pole, 6, 0.08);
              const bx = x - p.nx * s * 0.9, bz = z - p.nz * s * 0.9;
              batch.box(0.07, 0.07, 1.0, (x + bx) / 2, y0 + 3.95, (z + bz) / 2, -Math.atan2(p.nz, p.nx) + Math.PI / 2, pole);
              batch.box(0.03, 0.55, 0.03, bx, y0 + 3.4, bz, 0, pole);
              const cy = y0 + 3.05;
              batch.cylinder(0.32, 0.36, bx, cy - 0.3, bz, col('#5d4630'), 12, 0.42);
              units++;
              const N = 60;
              for (let i = 0; i < N; i++) {
                const yy = 1 - (i / (N - 1)) * 1.6; // top of sphere down past the equator
                const rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = i * 2.39996;
                const R = 0.55;
                slot(bx + Math.cos(th) * rr * R, bz + Math.sin(th) * rr * R, cy + yy * R * 0.8, { s: 0.62, hm: 0.18 });
              }
            }
          }
          area += units * 0.6;
          break;
        }
        case 'troughs': {
          const br = town.bridges[sh.bridge];
          for (const s of [1, -1]) {
            for (let k = -3; k <= 3; k += 2) {
              const p = br.p;
              const x = p.x + p.nx * br.half * s + p.dx * k * 2.2, z = p.z + p.nz * br.half * s + p.dz * k * 2.2;
              const y0 = groundHeight(p.x, p.z) + 1.1;
              batch.box(3.2, 0.42, 0.62, x, y0, z, -br.a, MATERIALS.trough);
              units++;
              area += 3.2 * 0.62;
              for (let u = -1.45; u <= 1.46; u += 0.26) for (const v of [-0.14, 0.14]) {
                slot(x + p.dx * u + p.nx * v, z + p.dz * u + p.nz * v, y0 + 0.42, { s: 0.8, hm: 0.7 });
              }
            }
          }
          break;
        }
        case 'meadow': {
          const [cx, cz] = sh.c;
          area += Math.PI * sh.r * sh.r;
          grid({ x0: cx - sh.r, x1: cx + sh.r, z0: cz - sh.r, z1: cz + sh.r }, 0.55, (x, z) => {
            const d = Math.hypot(x - cx, z - cz) / sh.r;
            const edge = d + Math.sin(Math.atan2(z - cz, x - cx) * 3 + si) * 0.12;
            if (edge < 1 && r() < 0.95 - edge * edge * 0.8) slot(x, z, groundHeight(x, z) + 0.02, { hm: 0.9 });
          });
          break;
        }
        case 'rows': {
          const b = polyBounds(sh.pts);
          let row = 0;
          for (let x = b.x0 + 1; x < b.x1; x += sh.spacing, row++) {
            for (let z = b.z0; z < b.z1; z += 0.5) {
              const xx = x + (r() - 0.5) * 0.25, zz = z + (r() - 0.5) * 0.15;
              if (!pointInPoly(xx, zz, sh.pts)) continue;
              slot(xx, zz, groundHeight(xx, zz), { band: row % 3, s: 1.3 });
            }
          }
          area += polyArea(sh.pts);
          break;
        }
      }
    }
    out.push({ id: site.id, slots, area: Math.round(area), units });
  });

  const mesh = new THREE.Mesh(batch.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true;
  return { mesh, sites: out };
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
  outer.holes.push(new THREE.Path(grow(0).map(([x, z]) => new THREE.Vector2(x, -z)).reverse()));
  const g = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  batch.add(g, new THREE.Matrix4(), color);
  g.dispose();
}
