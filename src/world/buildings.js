import * as THREE from 'three';
import { Batch, col } from './batch.js';
import { Occupancy } from './occupancy.js';
import { DATA, HALF_W, HALF_H, groundHeight, ROAD_WIDTH, MAJOR } from './geo.js';
import { rng } from './util.js';

const FLOOR = 3.2, BAY = 3.5, TEX_CELLS = 4;

const BRICK = [['#a8533d', 3], ['#b8674b', 3], ['#9b4a38', 2], ['#c0775a', 2], ['#b06a4f', 2], ['#8f5140', 1]];
const RENDER = [['#eee6d4', 4], ['#f3efe6', 3], ['#e9dcc0', 2], ['#e8d49c', 1.2], ['#e5bcaa', 0.8], ['#cbd5bf', 0.8], ['#c9d6de', 0.6], ['#d9cbb3', 1.5]];
const TILE = [['#8f4633', 3], ['#9e5237', 2], ['#7d3f2e', 2], ['#51575f', 2], ['#5d636b', 2], ['#474c53', 1]];
const FLAT = [['#8b8d8c', 2], ['#9c9a93', 2], ['#77797a', 1], ['#a8a49a', 1]];
const HOMES = new Set(['house', 'semidetached_house', 'detached', 'residential', 'terrace', 'bungalow', 'apartments', 'dormitory', 'farm']);
const SMALL = new Set(['garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'greenhouse', 'kiosk', 'service', 'toilets']);

function pick(list, r) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of list) if ((x -= w) <= 0) return v;
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
        b.fillStyle = 'rgba(40,50,48,0.85)'; b.fillRect(x0 + cell * 0.06, yTop + cell * 0.08, cell * 0.88, cell * 0.14);
      }
      const lit = r() < (ground ? 0.85 : 0.5);
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

const U = BAY * TEX_CELLS, V = FLOOR * TEX_CELLS;

function wall(batch, A, B, base, y0, y1, normal, color, edges) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const vb = (y0 - base) / V, vt = (y1 - base) / V;
  batch.quad([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], color,
    [[0, vb], [L / U, vb], [L / U, vt], [0, vt]], normal);
  if (edges && L > 2.5) edges.push({ A, B, n: [normal[0], normal[2]], base, top: y1, L });
}

// Rectangular building with a pitched (gabled or hipped) roof.
export function pitched(walls, roofs, props, o, edges) {
  const { cx, cz, a, w, d, eaves, roof, wall: wallCol, roofColor, chimney, base } = o;
  const f = frame(cx, cz, a);
  const y0 = base - 2, y1 = base + eaves;
  const C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  const N = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const wc = col(wallCol), rc = col(roofColor);
  for (let i = 0; i < 4; i++) {
    const A = f.p(...C[i], 0), B = f.p(...C[(i + 1) % 4], 0);
    wall(walls, [A[0], A[2]], [B[0], B[2]], base, y0, y1, f.dir(...N[i]), wc, edges);
  }
  const ov = 0.3, rh = o.rh ?? Math.min(d * 0.42, 4.2);
  const e = (lx, lz) => f.p(lx, lz, y1 - 0.2);
  const S = Math.hypot(d / 2 + ov, rh), vt = eaves / V;
  const hip = roof === 'hipped' ? Math.min(d / 2, w / 2 - 0.4) : 0;
  const R0 = f.p(-w / 2 - ov + hip, 0, y1 + rh), R1 = f.p(w / 2 + ov - hip, 0, y1 + rh);
  const uvs = [[0, 0], [w / 3, 0], [w / 3, S / 1.2], [0, S / 1.2]];
  roofs.quad(e(-w / 2 - ov, -d / 2 - ov), e(w / 2 + ov, -d / 2 - ov), R1, R0, rc, uvs);
  roofs.quad(e(w / 2 + ov, d / 2 + ov), e(-w / 2 - ov, d / 2 + ov), R0, R1, rc, uvs);
  if (hip) {
    roofs.tri(e(-w / 2 - ov, d / 2 + ov), e(-w / 2 - ov, -d / 2 - ov), R0, rc, [[0, 0], [d / 3, 0], [d / 6, S / 1.2]]);
    roofs.tri(e(w / 2 + ov, -d / 2 - ov), e(w / 2 + ov, d / 2 + ov), R1, rc, [[0, 0], [d / 3, 0], [d / 6, S / 1.2]]);
  } else {
    for (const sx of [-1, 1]) {
      const x = (sx * w) / 2;
      walls.tri(f.p(x, -d / 2, y1), f.p(x, d / 2, y1), f.p(x, 0, y1 + rh), wc,
        [[0, vt], [d / U, vt], [d / U / 2, vt + rh / V]], f.dir(sx, 0));
    }
  }
  if (chimney) {
    const p = f.p((w / 2 - 1.1) * (chimney > 0.5 ? 1 : -1), 0, y1 + rh - 0.7);
    props.box(0.8, 1.9, 1.2, p[0], p[1], p[2], -a, col('#8a4535'));
  }
}

// Any footprint: straight walls with a flat roof.
function flat(walls, roofs, pts, base, top, wallCol, roofCol, edges) {
  let area2 = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area2 += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  const sgn = area2 > 0 ? 1 : -1;
  const wc = col(wallCol);
  for (let i = 0; i < pts.length; i++) {
    const A = pts[i], B = pts[(i + 1) % pts.length];
    const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1;
    // outward normal for this winding
    const n = [(dz / L) * sgn, 0, (-dx / L) * sgn];
    wall(walls, A, B, base, base - 2, top, n, wc, edges);
  }
  const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
  const rc = col(roofCol);
  for (const [a, b, c] of tris) {
    roofs.tri([pts[a][0], top, pts[a][1]], [pts[b][0], top, pts[b][1]], [pts[c][0], top, pts[c][1]], rc, [[0, 0], [0, 0], [0, 0]], [0, 1, 0]);
  }
}

// Smallest rotated rectangle around a footprint (1° search) → [cx, cz, long, short, angle]
function minRect(pts) {
  let best = null;
  for (let deg = 0; deg < 90; deg++) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, z] of pts) {
      const u = x * c + z * s, v = -x * s + z * c;
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area) {
      const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
      const long = u1 - u0 >= v1 - v0;
      best = { area, rect: [uc * c - vc * s, uc * s + vc * c, Math.max(u1 - u0, v1 - v0), Math.min(u1 - u0, v1 - v0), long ? a : a + Math.PI / 2] };
    }
  }
  return best.rect;
}

// ---------- Town ----------
export function buildTown() {
  const occ = new Occupancy(Math.max(HALF_W, HALF_H), 2);
  // 1 = street, 4 = building
  for (const s of DATA.segments) {
    if (s.t !== 'road' || s.tunnel) continue;
    const w = ROAD_WIDTH[s.c] || 3;
    occ.markPolyline(s.p, w / 2 + (MAJOR.has(s.c) ? 2.2 : 0.4), 1);
  }
  for (const s of DATA.segments) if (s.t === 'rail') occ.markPolyline(s.p, 3, 1);
  for (const w of DATA.water.lines) occ.markPolyline(w.p, w.c === 'river' ? 5 : 2, 2);

  const tex = { shop: facadeTextures(true), house: facadeTextures(false) };
  const B = { shop: new Batch(), house: new Batch() };
  const roofs = new Batch(), flatRoofs = new Batch(), props = new Batch();
  const edges = [];
  const r = rng(424242);

  for (const b of DATA.buildings) {
    const pts = b.p;
    if (pts.length < 3) continue;
    let cx = 0, cz = 0;
    for (const [x, z] of pts) { cx += x; cz += z; }
    cx /= pts.length; cz /= pts.length;
    let area = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
    area = Math.abs(area / 2);
    occ.markPoly(pts, 4, (x, z) => inside(x, z, pts));

    let base = Infinity;
    for (const [x, z] of pts) base = Math.min(base, groundHeight(x, z));
    base = Math.min(base, groundHeight(cx, cz));

    const cls = b.c || '';
    const small = SMALL.has(cls) || area < 22;
    const home = HOMES.has(cls) || (!cls && area < 160);
    const central = Math.hypot(cx, cz) < 380;
    const kind = !home && !small && (central || ['commercial', 'retail', 'civic', 'office'].includes(cls)) ? 'shop' : 'house';
    const brickish = home ? r() < 0.7 : r() < 0.45;
    const wallCol = small ? pick([['#b9ada0', 1], ['#9d8f80', 1], ['#c9c0b2', 1]], r) : pick(brickish ? BRICK : RENDER, r);

    if (b.n === "St Mary's") { church(props, pts, base, edges); continue; }

    // Height of the walls (eaves)
    let total = b.h, eaves;
    if (!total && b.f) total = b.f * FLOOR + (b.rr ? 2.5 : 1);
    if (small) eaves = Math.min(total || 2.6, 3);
    else if (total) eaves = b.rr ? Math.max(2.8, total - Math.min(b.rr[3] * 0.42, 4)) : total;
    else if (home) eaves = cls === 'apartments' ? 9.5 : area > 90 && r() < 0.15 ? 8 : 5.6;
    else eaves = cls === 'civic' ? 11 : cls === 'school' ? 7 : cls === 'industrial' || cls === 'warehouse' ? 8 : central ? (r() < 0.45 ? 9.8 : 7.6) : 7;

    const rect = b.rr || (!small && area < 700 && area > 25 ? minRect(pts) : null);
    const rectOk = rect && area / (rect[2] * rect[3]) > 0.8;
    if (rectOk && !small && rect[3] < 16 && b.r !== 'flat') {
      pitched(B[kind], roofs, props, {
        cx: rect[0], cz: rect[1], w: rect[2], d: rect[3], a: rect[4], eaves, base,
        roof: b.r === 'hipped' || (b.r !== 'gabled' && r() < 0.35) ? 'hipped' : 'gabled',
        wall: wallCol, roofColor: pick(TILE, r), chimney: home && r() < 0.7 ? r() : 0,
      }, small ? null : edges);
    } else {
      flat(B[kind], flatRoofs, pts, base, base + eaves, wallCol, pick(FLAT, r), small ? null : edges);
    }
  }

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
  const add = (batch, mat) => { const m = new THREE.Mesh(batch.build(), mat); m.castShadow = m.receiveShadow = true; group.add(m); };
  add(roofs, new THREE.MeshStandardMaterial({ vertexColors: true, map: roofTexture(), roughness: 0.85, side: THREE.DoubleSide }));
  add(flatRoofs, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
  add(props, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }));

  return { group, occ, edges, wallMats };
}

function inside(x, z, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// St Mary's: flint walls, lead roof, and the west tower with its Hertfordshire spike.
function church(props, pts, base, edges) {
  const walls = props, roofs = props;
  const stone = '#cbc2aa', lead = '#737a82';
  flat(walls, props, pts, base, base + 7.5, stone, lead, edges);
  const [cx, cz, L, D, a] = minRect(pts);
  pitched(walls, roofs, props, { cx, cz, w: L * 0.84, d: D * 0.45, a, eaves: 11, base, roof: 'gabled', wall: stone, roofColor: lead, rh: 3.6 });
  // Tower at the west end of the long axis
  const dir = [Math.cos(a), Math.sin(a)];
  const west = dir[0] < 0 ? 1 : -1;
  const tx = cx + dir[0] * west * (L / 2 - 4.5), tz = cz + dir[1] * west * (L / 2 - 4.5);
  pitched(walls, roofs, props, { cx: tx, cz: tz, w: 9, d: 9, a, eaves: 24, base, roof: 'hipped', wall: stone, roofColor: lead, rh: 0.4 });
  const f = frame(tx, tz, a);
  for (let k = -4; k <= 4; k += 2) for (const [lx, lz] of [[k, -4.3], [k, 4.3], [-4.3, k], [4.3, k]]) {
    const p = f.p(lx, lz, base + 24);
    props.box(1, 1.2, 1, p[0], p[1], p[2], -a, col(stone));
  }
  props.cylinder(1.6, 7, tx, base + 24.3, tz, col(lead), 8, 0);
}
