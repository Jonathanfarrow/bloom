import * as THREE from 'three';
import { ROADS, PLAZA, GREENS, RIVER, HILL, LANDMARKS, BRIDGES, ROUNDABOUT } from '../data/town.js';
import { Batch, col } from './batch.js';
import { Occupancy } from './occupancy.js';
import { groundHeight, Path, pointInPoly, rng } from './util.js';

const FLOOR = 3.2, BAY = 3.5, TEX_CELLS = 4;

const WALLS = [
  ['#a8533d', 3], ['#b8674b', 3], ['#9b4a38', 2], ['#c0775a', 2],
  ['#eee6d4', 4], ['#f3efe6', 3], ['#e9dcc0', 2], ['#e8d49c', 1.5],
  ['#e5bcaa', 1], ['#cbd5bf', 1], ['#c9d6de', 0.8], ['#d9cbb3', 1.5],
];
const ROOFS = [['#8f4633', 3], ['#9e5237', 2], ['#7d3f2e', 2], ['#51575f', 2], ['#5d636b', 2], ['#474c53', 1]];

function pick(list, r) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of list) { if ((x -= w) <= 0) return v; }
  return list[0][0];
}

// ---------- Textures ----------
function facadeTextures(shop) {
  const S = 512, cell = S / TEX_CELLS;
  const base = document.createElement('canvas'); base.width = base.height = S;
  const glow = document.createElement('canvas'); glow.width = glow.height = S;
  const b = base.getContext('2d'), g = glow.getContext('2d');
  b.fillStyle = '#ffffff'; b.fillRect(0, 0, S, S);
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 3000; i++) {
    b.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    b.fillRect(Math.random() * S, Math.random() * S, 2 + Math.random() * 4, 1 + Math.random() * 2);
  }
  const r = rng(shop ? 7 : 11);
  for (let row = 0; row < TEX_CELLS; row++) {
    for (let c = 0; c < TEX_CELLS; c++) {
      const x0 = c * cell, yTop = S - (row + 1) * cell;
      const ground = shop && row === 0;
      const wx = x0 + cell * (ground ? 0.1 : 0.3), ww = cell * (ground ? 0.8 : 0.4);
      const wy = yTop + cell * (ground ? 0.3 : 0.22), wh = cell * (ground ? 0.58 : 0.48);
      // frame + glass
      b.fillStyle = ground ? '#2f3a37' : '#f7f5ef';
      b.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      b.fillStyle = '#35434d'; b.fillRect(wx, wy, ww, wh);
      b.fillStyle = 'rgba(255,255,255,0.18)'; b.fillRect(wx, wy, ww * 0.45, wh);
      if (!ground) {
        b.fillStyle = '#f7f5ef';
        b.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        b.fillRect(wx, wy + wh / 2 - 2, ww, 4);
        b.fillStyle = '#e4ded2'; b.fillRect(wx - 9, wy + wh + 5, ww + 18, 7);
      } else {
        // fascia sign band
        b.fillStyle = 'rgba(40,50,48,0.85)'; b.fillRect(x0 + cell * 0.06, yTop + cell * 0.08, cell * 0.88, cell * 0.14);
      }
      const lit = r() < (ground ? 0.85 : 0.55);
      g.fillStyle = lit ? (r() < 0.5 ? '#ffc76e' : '#ffdca0') : '#1a1408';
      g.fillRect(wx, wy, ww, wh);
    }
  }
  const mk = (cv) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  };
  return { map: mk(base), emissiveMap: mk(glow) };
}

function roofTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
  for (let r = 0; r < 8; r++) {
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(0, r * 8 + 6, 64, 2);
    for (let k = 0; k < 6; k++) {
      x.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.1})`;
      x.fillRect(((r % 2) * 5 + k * 11) % 64, r * 8, 10, 6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------- Geometry ----------
function frame(cx, cz, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return {
    p: (lx, lz, y) => [cx + lx * c - lz * s, y, cz + lx * s + lz * c],
    dir: (lx, lz) => [lx * c - lz * s, 0, lx * s + lz * c],
  };
}

// Adds a building to `walls` and `roofs` batches. Returns its front wall.
export function addBuilding(walls, roofs, props, o) {
  const { cx, cz, a, w, d, h, roof = 'gable', wall, roofColor, chimney = 0 } = o;
  const base = o.base ?? groundHeight(cx, cz);
  const f = frame(cx, cz, a);
  const y0 = base - 1.5, y1 = base + h;
  const C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  const N = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const wc = col(wall), rc = col(roofColor);
  const U = BAY * TEX_CELLS, V = FLOOR * TEX_CELLS;
  const vb = (y0 - base) / V, vt = h / V;
  for (let i = 0; i < 4; i++) {
    const A = C[i], B = C[(i + 1) % 4];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const n = f.dir(N[i][0], N[i][1]);
    walls.quad(f.p(A[0], A[1], y0), f.p(B[0], B[1], y0), f.p(B[0], B[1], y1), f.p(A[0], A[1], y1), wc,
      [[0, vb], [L / U, vb], [L / U, vt], [0, vt]], n);
  }
  const ov = 0.35;
  const along = roof === 'gableX' ? 'z' : 'x';
  if (roof === 'flat') {
    roofs.quad(f.p(-w / 2, -d / 2, y1), f.p(w / 2, -d / 2, y1), f.p(w / 2, d / 2, y1), f.p(-w / 2, d / 2, y1), rc.clone().offsetHSL(0, -0.1, 0.1),
      [[0, 0], [w / 3, 0], [w / 3, d / 3], [0, d / 3]], [0, 1, 0]);
  } else if (along === 'x') {
    const rh = o.rh ?? Math.min(d * 0.42, 4.6);
    const hip = roof === 'hip' ? Math.min(d / 2, w / 2 - 0.5) : 0;
    const R0 = f.p(-w / 2 - ov + hip, 0, y1 + rh), R1 = f.p(w / 2 + ov - hip, 0, y1 + rh);
    const e = (lx, lz) => f.p(lx, lz, y1 - 0.25);
    const S = Math.hypot(d / 2 + ov, rh);
    const uvs = [[0, 0], [w / 3, 0], [w / 3, S / 1.2], [0, S / 1.2]];
    roofs.quad(e(-w / 2 - ov, -d / 2 - ov), e(w / 2 + ov, -d / 2 - ov), R1, R0, rc, uvs);
    roofs.quad(e(w / 2 + ov, d / 2 + ov), e(-w / 2 - ov, d / 2 + ov), R0, R1, rc, uvs);
    if (hip) {
      roofs.tri(e(-w / 2 - ov, d / 2 + ov), e(-w / 2 - ov, -d / 2 - ov), R0, rc, [[0, 0], [d / 3, 0], [d / 6, S / 1.2]]);
      roofs.tri(e(w / 2 + ov, -d / 2 - ov), e(w / 2 + ov, d / 2 + ov), R1, rc, [[0, 0], [d / 3, 0], [d / 6, S / 1.2]]);
    } else {
      for (const sx of [-1, 1]) {
        const x = (sx * w) / 2;
        const u0 = 0, u1 = d / U;
        walls.tri(f.p(x, -d / 2, y1), f.p(x, d / 2, y1), f.p(x, 0, y1 + rh), wc,
          [[u0, vt], [u1, vt], [u1 / 2, vt + rh / V]], f.dir(sx, 0));
      }
    }
    if (chimney) {
      const cx2 = (w / 2 - 1.2) * (chimney > 0.5 ? 1 : -1);
      const p = f.p(cx2, 0, y1 + rh - 0.6);
      props.box(0.9, 2.0, 1.3, p[0], p[1], p[2], -a, col('#8a4535'));
    }
  } else {
    const rh = o.rh ?? Math.min(w * 0.42, 4.6);
    const R0 = f.p(0, -d / 2 - ov, y1 + rh), R1 = f.p(0, d / 2 + ov, y1 + rh);
    const e = (lx, lz) => f.p(lx, lz, y1 - 0.25);
    const S = Math.hypot(w / 2 + ov, rh);
    const uvs = [[0, 0], [d / 3, 0], [d / 3, S / 1.2], [0, S / 1.2]];
    roofs.quad(e(-w / 2 - ov, d / 2 + ov), e(-w / 2 - ov, -d / 2 - ov), R0, R1, rc, uvs);
    roofs.quad(e(w / 2 + ov, -d / 2 - ov), e(w / 2 + ov, d / 2 + ov), R1, R0, rc, uvs);
    for (const sz of [-1, 1]) {
      const z = (sz * d) / 2;
      walls.tri(f.p(-w / 2, z, y1), f.p(w / 2, z, y1), f.p(0, z, y1 + rh), wc,
        [[0, vt], [w / U, vt], [w / U / 2, vt + rh / V]], f.dir(0, sz));
    }
  }
  return { base, h, floors: Math.round(h / FLOOR), A: C, frame: f, a, w, d, cx, cz };
}

// ---------- Town layout ----------
export function buildTown() {
  const occ = new Occupancy();
  const r = rng(20240601);
  const roadPaths = new Map();

  // 1 = roads, 2 = parks/water, 3 = landmarks & reserved
  for (const road of ROADS) {
    const pave = road.pave ?? (road.res ? 2 : 2.5);
    occ.markPolyline(road.pts, road.w / 2 + pave + 0.6, 1);
    if (road.name) roadPaths.set(road.name, new Path(road.pts));
  }
  occ.markPolyline(RIVER.pts, RIVER.w / 2 + 8, 2);
  for (const g of GREENS) occ.markPoly(g.pts, 2, (x, z) => pointInPoly(x, z, g.pts));
  occ.markPoly([[PLAZA.x0 - 1, PLAZA.z0 - 1], [PLAZA.x1 + 1, PLAZA.z1 + 1]], 1, () => true);
  occ.markPoly([[HILL.x - HILL.keepOut, HILL.z - HILL.keepOut], [HILL.x + HILL.keepOut, HILL.z + HILL.keepOut]], 2,
    (x, z) => Math.hypot(x - HILL.x, z - HILL.z) < HILL.keepOut);
  occ.markPoly([[ROUNDABOUT.x - 26, ROUNDABOUT.z - 26], [ROUNDABOUT.x + 26, ROUNDABOUT.z + 26]], 1,
    (x, z) => Math.hypot(x - ROUNDABOUT.x, z - ROUNDABOUT.z) < ROUNDABOUT.r + 4);
  for (const L of Object.values(LANDMARKS)) occ.markRect(L.c[0], L.c[1], L.size[0], L.size[1], 0, 3, 3);
  // Keep the fronts of the Town Hall and British Schools clear for their beds
  occ.markRect(-82, -160, 8, 34, 0, 3);
  occ.markRect(235, -10, 16, 36, 0, 3);

  const tex = { shop: facadeTextures(true), house: facadeTextures(false) };
  const B = { shop: new Batch(), house: new Batch() };
  const roofs = new Batch(), props = new Batch();
  const fronts = new Map(); // road name → [{A, B, normal, base, floors}]

  const SHOP_STREETS = new Set(['High Street', 'Sun Street', 'Bucklersbury', 'Hermitage Road', 'Bridge Street', 'Churchyard', 'Brand Street', 'Market Place', 'Bancroft']);

  function placeAlong(pts, name, opts) {
    const path = new Path(pts);
    const list = fronts.get(name) || [];
    fronts.set(name, list);
    for (const side of [1, -1]) {
      let t = opts.start ?? 2;
      while (t < path.length - 2) {
        const w = opts.w[0] + r() * (opts.w[1] - opts.w[0]);
        const d = opts.d[0] + r() * (opts.d[1] - opts.d[0]);
        const p = path.at(t + w / 2);
        const off = opts.setback + d / 2;
        const cx = p.x + p.nx * side * off, cz = p.z + p.nz * side * off;
        const a = Math.atan2(p.dz, p.dx);
        if (occ.rectFree(cx, cz, w, d, a)) {
          occ.markRect(cx, cz, w, d, a, 4, 0.4);
          const floors = opts.floors[Math.floor(r() * opts.floors.length)];
          const h = floors * FLOOR + 0.4;
          const roofRoll = r();
          const roof = opts.flatChance && roofRoll < opts.flatChance ? 'flat' : roofRoll < 0.62 ? 'gable' : roofRoll < 0.82 ? 'gableX' : 'hip';
          const kind = opts.shop ? 'shop' : 'house';
          const bld = addBuilding(B[kind], roofs, props, {
            cx, cz, a, w, d, h, roof: w < 7 && roof === 'hip' ? 'gable' : roof,
            wall: pick(WALLS, r), roofColor: pick(ROOFS, r), chimney: r() < 0.6 ? r() : 0,
          });
          // Front wall faces the street: edge 0→1 when side=+1, edge 2→3 when side=-1
          const [i0, i1] = side === 1 ? [0, 1] : [2, 3];
          const A = bld.A[i0], Bc = bld.A[i1];
          list.push({
            A: bld.frame.p(A[0], A[1], 0), B: bld.frame.p(Bc[0], Bc[1], 0),
            normal: bld.frame.dir(0, side === 1 ? -1 : 1), base: bld.base, floors: floors, t: t + w / 2, side, shop: opts.shop,
          });
          t += w + (opts.gap ? opts.gap[0] + r() * (opts.gap[1] - opts.gap[0]) : 0);
        } else {
          t += 2;
        }
      }
    }
  }

  // Market Place frontages first so the square is fully enclosed
  const { x0, x1, z0, z1 } = PLAZA;
  for (const edge of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]) {
    placeAlong(edge, 'Market Place', { w: [6, 10], d: [12, 18], setback: 1.2, floors: [2, 3, 3, 4], shop: true, start: 0 });
  }
  for (const road of ROADS) {
    const pave = road.pave ?? (road.res ? 2 : 2.5);
    if (road.res) {
      placeAlong(road.pts, '', { w: [6, 8.5], d: [8, 10], setback: road.w / 2 + pave + 4, floors: [2, 2, 2, 3], gap: [1, 4], shop: false });
    } else {
      const shop = SHOP_STREETS.has(road.name);
      placeAlong(road.pts, road.name, { w: [5.5, 12], d: [10, 18], setback: road.w / 2 + pave + 0.6, floors: shop ? [2, 3, 3, 4] : [2, 2, 3], shop, flatChance: 0.06, gap: shop ? [0, 0.4] : [0.5, 3] });
    }
  }
  // A second, looser row behind the main streets to fill the blocks
  for (const road of ROADS) {
    if (road.res) continue;
    const pave = road.pave ?? 2.5;
    placeAlong(road.pts, '', { w: [6, 10], d: [8, 12], setback: road.w / 2 + pave + 24, floors: [2, 2, 3], gap: [2, 7], shop: false });
  }

  // ----- Landmarks -----
  const stone = '#cfc6ae', lead = '#727880';
  const { church, cornExchange, townHall, britishSchools, priory } = LANDMARKS;
  const [chx, chz] = church.c;
  addBuilding(props, props, props, { cx: chx + 2, cz: chz, a: 0, w: 44, d: 26, h: 6.5, roof: 'gable', rh: 1.8, wall: stone, roofColor: lead });
  addBuilding(props, props, props, { cx: chx + 2, cz: chz, a: 0, w: 44, d: 12, h: 11.5, roof: 'gable', rh: 4, wall: stone, roofColor: lead });
  addBuilding(props, props, props, { cx: chx + 32, cz: chz, a: 0, w: 16, d: 11, h: 9, roof: 'gable', rh: 4, wall: stone, roofColor: lead });
  addBuilding(props, props, props, { cx: chx - 5, cz: chz + 15.5, a: 0, w: 6, d: 5, h: 5.5, roof: 'gableX', rh: 2.4, wall: stone, roofColor: lead });
  const tb = groundHeight(chx - 27, chz);
  addBuilding(props, props, props, { cx: chx - 26, cz: chz, a: 0, w: 10, d: 10, h: 25, roof: 'flat', wall: stone, roofColor: '#9aa0a4' });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
    const sx = [-1, 1, 1, -1][i], sz = [-1, -1, 1, 1][i];
    const lx = i % 2 === 0 ? -4.6 + k * 3.07 : sx * 4.6, lz = i % 2 === 0 ? sz * 4.6 : -4.6 + k * 3.07;
    props.box(1.1, 1.3, 1.1, chx - 26 + lx, tb + 25, chz + lz, 0, col(stone));
  }
  props.cylinder(1.8, 7.5, chx - 26, tb + 25, chz, col(lead), 8, 0);
  const dark = col('#3b4146');
  for (let x = chx - 17; x <= chx + 22; x += 6.5) {
    for (const s of [-1, 1]) {
      props.box(2, 3.4, 0.3, x, tb + 1.6, chz + s * 13.05, 0, dark);
      props.box(1.6, 2.2, 0.3, x, tb + 7.8, chz + s * 6.05, 0, dark);
    }
  }
  props.box(0.3, 6, 3.6, chx + 40.1, tb + 1.8, chz, 0, dark); // east window

  // Corn Exchange — faces east onto Market Place
  const ce = addBuilding(B.shop, roofs, props, { cx: cornExchange.c[0], cz: cornExchange.c[1], a: Math.PI / 2, w: 26, d: 16, h: 9.5, roof: 'gableX', rh: 4.5, wall: '#ece2c9', roofColor: '#51575f' });
  props.box(2.2, 2.4, 2.2, cornExchange.c[0], ce.base + 13.6, cornExchange.c[1], 0, col('#ece2c9'));
  props.cylinder(1.4, 2.4, cornExchange.c[0], ce.base + 16, cornExchange.c[1], col('#5f7f78'), 8, 0);
  // Town Hall — faces east onto Brand Street
  const th = addBuilding(B.house, roofs, props, { cx: townHall.c[0], cz: townHall.c[1], a: Math.PI / 2, w: 32, d: 22, h: 12, roof: 'gable', rh: 5.5, wall: '#a44d38', roofColor: '#51575f' });
  props.box(3, 4, 3, townHall.c[0], th.base + 16, townHall.c[1], 0, col('#e6dcc6'));
  props.cylinder(2.2, 3.5, townHall.c[0], th.base + 20, townHall.c[1], col('#5a6068'), 4, 0);
  props.box(6, 1, 3, townHall.c[0] + 12.5, th.base, townHall.c[1], Math.PI / 2, col('#d6cdb9')); // steps
  // British Schools — faces west onto Queen Street
  const bs = addBuilding(B.house, roofs, props, { cx: britishSchools.c[0], cz: britishSchools.c[1], a: -Math.PI / 2, w: 32, d: 14, h: 7, roof: 'gable', rh: 4.5, wall: '#b25a43', roofColor: '#5d636b' });
  props.box(1.4, 2.2, 1.4, britishSchools.c[0], bs.base + 11.2, britishSchools.c[1] + 8, 0, col('#efe8d8'));
  props.cylinder(1.2, 1.6, britishSchools.c[0], bs.base + 13.4, britishSchools.c[1] + 8, col('#5d636b'), 4, 0);
  // Hitchin Priory
  addBuilding(B.house, roofs, props, { cx: priory.c[0], cz: priory.c[1], a: 0, w: 46, d: 20, h: 12.5, roof: 'hip', rh: 4, wall: '#efe8d8', roofColor: '#5d636b' });
  addBuilding(B.house, roofs, props, { cx: priory.c[0] - 18, cz: priory.c[1] + 18, a: 0, w: 10, d: 18, h: 9, roof: 'hip', rh: 3, wall: '#efe8d8', roofColor: '#5d636b' });

  // Market stalls
  const awnings = ['#c8453a', '#3f7d4d', '#3c5f94', '#d99a2b'];
  [-19, -7, 5, 17].forEach((z, i) => {
    const x = -13, y = groundHeight(x, z) + 0.09;
    props.box(2.6, 0.95, 4.4, x, y, z, 0, col('#8c6444'));
    props.box(2.2, 0.35, 4.0, x, y + 0.95, z, 0, col(['#e4c057', '#d2593b', '#7bab4d', '#e98f3c'][i]));
    for (const [px, pz] of [[-1.4, -2.3], [1.4, -2.3], [1.4, 2.3], [-1.4, 2.3]]) props.box(0.1, 2.5, 0.1, x + px, y, z + pz, 0, col('#e8e4dc'));
    const f = frame(x, z, Math.PI / 2);
    const ac = col(awnings[i]);
    props.quad(f.p(-2.5, -1.7, y + 2.3), f.p(2.5, -1.7, y + 2.3), f.p(2.5, 0, y + 3.1), f.p(-2.5, 0, y + 3.1), ac);
    props.quad(f.p(2.5, 1.7, y + 2.3), f.p(-2.5, 1.7, y + 2.3), f.p(-2.5, 0, y + 3.1), f.p(2.5, 0, y + 3.1), ac);
  });

  // Bridge parapets
  const bridges = {};
  for (const br of BRIDGES) {
    if (br.skip) continue;
    const road = ROADS.find((x) => x.name === br.road);
    const path = roadPaths.get(br.road);
    const t = path.closestT(br.at[0], br.at[1]);
    const p = path.at(t);
    const a = Math.atan2(p.dz, p.dx);
    const half = road.w / 2 + (road.pave ?? 2.5) + 0.3;
    bridges[br.road] = { t, p, a, half, len: 18 };
    for (const s of [-1, 1]) {
      props.box(18, 1.1, 0.5, p.x + p.nx * half * s, groundHeight(p.x, p.z), p.z + p.nz * half * s, -a, col('#b8ad97'));
    }
  }

  // Roundabout welcome sign
  const ry = groundHeight(ROUNDABOUT.x, ROUNDABOUT.z) + 0.15;
  props.box(4.2, 1.4, 0.3, ROUNDABOUT.x, ry + 0.4, ROUNDABOUT.z - 2.5, 0, col('#233a2e'));
  props.box(0.2, 0.5, 0.2, ROUNDABOUT.x - 1.8, ry, ROUNDABOUT.z - 2.5, 0, col('#233a2e'));
  props.box(0.2, 0.5, 0.2, ROUNDABOUT.x + 1.8, ry, ROUNDABOUT.z - 2.5, 0, col('#233a2e'));

  // ----- Meshes -----
  const group = new THREE.Group();
  const wallMats = {};
  for (const kind of ['shop', 'house']) {
    wallMats[kind] = new THREE.MeshStandardMaterial({
      vertexColors: true, map: tex[kind].map, emissiveMap: tex[kind].emissiveMap,
      emissive: new THREE.Color('#ffbe6a'), emissiveIntensity: 0, roughness: 0.92, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(B[kind].build(), wallMats[kind]);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }
  const roofMesh = new THREE.Mesh(roofs.build(), new THREE.MeshStandardMaterial({ vertexColors: true, map: roofTexture(), roughness: 0.85, side: THREE.DoubleSide }));
  roofMesh.castShadow = roofMesh.receiveShadow = true;
  group.add(roofMesh);
  const propMesh = new THREE.Mesh(props.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }));
  propMesh.castShadow = propMesh.receiveShadow = true;
  group.add(propMesh);

  return { group, occ, fronts, roadPaths, bridges, wallMats };
}
