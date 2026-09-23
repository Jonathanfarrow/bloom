import * as THREE from 'three';
import { Batch, col } from './batch.js';
import { Occupancy } from './occupancy.js';
import { DATA, HALF_W, HALF_H, groundHeight, ROAD_WIDTH, MAJOR } from './geo.js';
import { rng } from './util.js';

// One facade texture cell = one window bay (3.5 m) × one storey (3.2 m); textures hold 4 × 4 cells.
export const FLOOR = 3.2, BAY = 3.5;
const CELLS = 4, U = BAY * CELLS, V = FLOOR * CELLS;
export const SILL = 0.24; // window sills sit this far up each storey (fraction of a storey)

// Softened, slightly warm palette for the architectural-model look
const BRICK = [['#b3634a', 3], ['#a8573f', 3], ['#bf7458', 2], ['#9a5442', 2], ['#c4876a', 1.5], ['#8e4c3c', 1]];
const RENDER = [['#f1ebdd', 4], ['#f6f2ea', 3], ['#ece0c6', 2], ['#eadbad', 1.2], ['#e8c9b8', 0.8], ['#d3dcc8', 0.8], ['#d2dde3', 0.6], ['#e3d6bf', 1.5]];
const LIMEWASH = [['#f3eee2', 3], ['#efe5cf', 2], ['#f2e7c7', 1]];
const MODERN = [['#ddd8cc', 2], ['#cfc9bc', 2], ['#bfb9ac', 1], ['#b9785f', 1]];
const CLAY = [['#a45a3e', 3], ['#94513a', 3], ['#b0694a', 2], ['#8a4a36', 1]];
const SLATE = [['#5f656d', 2], ['#6b7078', 2], ['#575c63', 1]];
const FLAT = [['#8e908c', 2], ['#a09d95', 2], ['#7d7f7e', 1]];
const HOMES = new Set(['house', 'semidetached_house', 'detached', 'residential', 'terrace', 'bungalow', 'apartments', 'dormitory', 'farm']);
const SMALL = new Set(['garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'greenhouse', 'kiosk', 'service', 'toilets']);
const FASCIAS = ['#1f4d3a', '#6b1f2a', '#1e2f4f', '#2b2b2b', '#40636b', '#7a5a2a', '#284a2b', '#5a2d4a'];

function pick(list, r) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of list) if ((x -= w) <= 0) return v;
  return list[0][0];
}

// ---------- Facade textures ----------
// Each style paints three canvases in step: colour, a tint mask (white = take the
// wall colour, black = keep painted colour, e.g. white window frames), and a
// night-time glow map for lit windows.
function facade(style, seed) {
  const S = 512, c = S / CELLS;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = S; return [cv, cv.getContext('2d')]; };
  const [cb, b] = mk(), [cm, m] = mk(), [cg, g] = mk();
  const r = rng(seed);
  b.fillStyle = '#fff'; b.fillRect(0, 0, S, S);
  m.fillStyle = '#fff'; m.fillRect(0, 0, S, S);
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  // paint(x, y, w, h, colour, tinted?)
  const paint = (x, y, w, h, colour, tint = false) => {
    b.fillStyle = colour; b.fillRect(x, y, w, h);
    m.fillStyle = tint ? '#fff' : '#000'; m.fillRect(x, y, w, h);
  };
  const glow = (x, y, w, h, p) => { g.fillStyle = r() < p ? (r() < 0.5 ? '#ffc76e' : '#ffe0a8') : '#140f06'; g.fillRect(x, y, w, h); };
  // gentle weathering on every wall
  for (let i = 0; i < 2500; i++) {
    b.fillStyle = `rgba(60,40,20,${Math.random() * 0.045})`;
    b.fillRect(Math.random() * S, Math.random() * S, 2 + Math.random() * 5, 1 + Math.random() * 3);
  }
  const sash = (x, y, w, h, panesX, panesY, frame = '#f6f3ea') => {
    paint(x - 4, y - 4, w + 8, h + 8, frame);
    paint(x, y, w, h, '#33414a');
    paint(x + 2, y + 2, w * 0.4, h - 4, '#44555f');
    for (let k = 1; k < panesX; k++) paint(x + (w * k) / panesX - 1, y, 2, h, frame);
    for (let k = 1; k < panesY; k++) paint(x, y + (h * k) / panesY - 1, w, 2, frame);
    paint(x, y + h / 2 - 2, w, 4, frame);
  };
  for (let row = 0; row < CELLS; row++) {
    for (let col = 0; col < CELLS; col++) {
      const x0 = col * c, y0 = S - (row + 1) * c; // row 0 = ground floor
      const top = (f) => y0 + c * (1 - f); // canvas y for a height fraction within the storey
      const shopFloor = style === 'shop' && row === 0;
      if (shopFloor) {
        const fascia = FASCIAS[(col + seed) % FASCIAS.length];
        paint(x0, top(1), c, c, '#e9e3d6');                      // pilasters/stucco
        paint(x0 + 6, top(0.9), c - 12, c * 0.16, fascia);       // fascia board
        for (let k = 0; k < 5; k++) paint(x0 + 22 + k * 16, top(0.83), 9, 3, 'rgba(240,230,200,0.9)'); // lettering
        paint(x0 + 10, top(0.7), c - 20, c * 0.52, fascia);      // shopfront frame
        paint(x0 + 14, top(0.66), c - 28, c * 0.46, '#2e3a3f');  // display glass
        paint(x0 + 16, top(0.66), (c - 28) * 0.35, c * 0.46, '#3e4c52');
        paint(x0 + c / 2 - 1, top(0.66), 2, c * 0.46, fascia);
        paint(x0 + 10, top(0.18), c - 20, c * 0.14, fascia);     // stallriser
        glow(x0 + 14, top(0.66), c - 28, c * 0.46, 0.85);
        continue;
      }
      if (style === 'plain') continue;
      if (style === 'victorian') {
        // mortar courses on the (tinted) brick
        for (let yy = y0; yy < y0 + c; yy += 7) paint(x0, yy, c, 1, 'rgba(0,0,0,0.10)', true);
        const w = c * 0.34, h = c * 0.5, x = x0 + (c - w) / 2, y = top(SILL + 0.5);
        paint(x - 8, y - 12, w + 16, 9, '#e6dcc6');              // stone lintel
        sash(x, y, w, h, 2, 2);
        paint(x - 7, y + h + 3, w + 14, 6, '#e6dcc6');           // sill
        if (row === 0 && col % 2 === 1) { paint(x0 + c * 0.36, top(0.72), c * 0.28, c * 0.72, '#2a3b33'); continue; } // front door
        glow(x, y, w, h, 0.5);
      } else if (style === 'georgian' || style === 'shop') {
        if (row > 0 || style === 'georgian') paint(x0, y0 + c - 3, c, 3, 'rgba(0,0,0,0.06)', true); // string course
        const w = c * 0.3, h = c * 0.56, x = x0 + (c - w) / 2, y = top(SILL + 0.56);
        sash(x, y, w, h, 3, 4);
        paint(x - 6, y + h + 3, w + 12, 5, '#ebe6da');
        if (style === 'georgian' && row === 0 && col === 1) {
          paint(x0 + c * 0.34, top(0.78), c * 0.32, c * 0.78, '#f4f0e6');
          paint(x0 + c * 0.38, top(0.7), c * 0.24, c * 0.7, ['#1f3a4a', '#23402e', '#5a1f24', '#222'][seed % 4]);
          continue;
        }
        glow(x, y, w, h, 0.5);
      } else if (style === 'tudor') {
        const beam = '#2d2622';
        paint(x0, y0, 7, c, beam); paint(x0 + c / 2 - 3, y0, 6, c, beam);
        paint(x0, y0, c, 7, beam); paint(x0, y0 + c * 0.55, c, 5, beam);
        // diagonal braces
        b.save(); m.save();
        for (const ctx of [b, m]) {
          ctx.strokeStyle = ctx === b ? beam : '#000'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(x0 + 4, y0 + c * 0.55); ctx.lineTo(x0 + c / 2 - 2, y0 + 6); ctx.stroke();
        }
        b.restore(); m.restore();
        const w = c * 0.3, h = c * 0.3, x = x0 + c * 0.6, y = top(SILL + 0.3);
        paint(x - 3, y - 3, w + 6, h + 6, beam);
        paint(x, y, w, h, '#3a3f3c');
        b.strokeStyle = 'rgba(200,200,190,0.35)'; b.lineWidth = 1;
        for (let k = -h; k < w; k += 6) { b.beginPath(); b.moveTo(x + k, y); b.lineTo(x + k + h, y + h); b.moveTo(x + k + h, y); b.lineTo(x + k, y + h); b.stroke(); }
        glow(x, y, w, h, 0.5);
      } else if (style === 'modern') {
        const y = top(SILL + 0.52), h = c * 0.52;
        paint(x0, y - 3, c, h + 6, '#9aa3a6');
        paint(x0, y, c, h, '#3b4a52');
        paint(x0 + 3, y + 2, c * 0.35, h - 4, '#4b5c64');
        for (let k = 0; k < 4; k++) paint(x0 + (k * c) / 4, y, 3, h, '#9aa3a6');
        glow(x0, y, c, h, 0.45);
      }
    }
  }
  const tex = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(cb, true), mask: tex(cm, false), glow: tex(cg, true) };
}

function wallMaterial(style, seed) {
  const t = facade(style, seed);
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, map: t.map, emissiveMap: t.glow, emissive: new THREE.Color('#ffbe6a'),
    emissiveIntensity: 0, roughness: 0.93, side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tintMask = { value: t.mask };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tintMask;')
      .replace('#include <color_fragment>', `
#if defined( USE_COLOR ) && defined( USE_MAP )
  float tintAmt = texture2D( tintMask, vMapUv ).r;
  diffuseColor.rgb *= mix( vec3( 1.0 ), vColor, tintAmt );
#else
  #include <color_fragment>
#endif`);
  };
  mat.customProgramCacheKey = () => 'facade';
  return mat;
}

function roofTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 16; r++) {
    x.fillStyle = 'rgba(40,20,10,0.22)'; x.fillRect(0, r * 8 + 6, 128, 2);
    for (let k = 0; k < 12; k++) {
      x.fillStyle = `rgba(40,20,10,${0.03 + Math.random() * 0.12})`;
      x.fillRect(((r % 2) * 5 + k * 11) % 128, r * 8, 10, 6);
      x.fillStyle = 'rgba(40,20,10,0.15)'; x.fillRect(((r % 2) * 5 + k * 11) % 128, r * 8, 1, 6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------- Geometry helpers ----------
function frame(cx, cz, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return {
    p: (lx, lz, y) => [cx + lx * c - lz * s, y, cz + lx * s + lz * c],
    dir: (lx, lz) => [lx * c - lz * s, 0, lx * s + lz * c],
  };
}

function wall(batch, A, B, base, y0, y1, normal, color, edges) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const vb = (y0 - base) / V, vt = (y1 - base) / V;
  batch.quad([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], color,
    [[0, vb], [L / U, vb], [L / U, vt], [0, vt]], normal);
  if (edges && L > 2.5) edges.push({ A, B, n: [normal[0], normal[2]], base, top: y1, L });
}

function footprintWalls(batch, pts, base, top, color, edges) {
  let area2 = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area2 += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  const sgn = area2 > 0 ? 1 : -1;
  for (let i = 0; i < pts.length; i++) {
    const A = pts[i], B = pts[(i + 1) % pts.length];
    const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1;
    wall(batch, A, B, base, base - 2, top, [(dz / L) * sgn, 0, (-dx / L) * sgn], color, edges);
  }
}

function flatRoof(batch, pts, top, color) {
  const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
  for (const [a, b, c] of tris) batch.tri([pts[a][0], top, pts[a][1]], [pts[b][0], top, pts[b][1]], [pts[c][0], top, pts[c][1]], color, undefined, [0, 1, 0]);
}

// Hipped roof from the precomputed straight skeleton (scripts/roofs.mjs)
function skeletonRoof(batch, sk, eaves, pitch, cap, color) {
  const V3 = sk.v.map(([x, z, t]) => [x, eaves + Math.min(t * pitch, cap), z, t]);
  for (const face of sk.f) {
    if (face.length < 3) continue;
    // tile courses run parallel to the eaves edge of this face
    let e0 = null, e1 = null;
    for (let i = 0; i < face.length; i++) {
      const a = V3[face[i]], b = V3[face[(i + 1) % face.length]];
      if (a[3] < 0.01 && b[3] < 0.01) { e0 = a; e1 = b; break; }
    }
    const ex = e1 ? e1[0] - e0[0] : 1, ez = e1 ? e1[2] - e0[2] : 0, el = Math.hypot(ex, ez) || 1;
    const uv = (p) => [((p[0] - (e0 ? e0[0] : 0)) * ex + (p[2] - (e0 ? e0[2] : 0)) * ez) / el / 3, p[3] / 1.1];
    const pts2 = face.map((i) => new THREE.Vector2(V3[i][0], V3[i][2]));
    let tris;
    try { tris = THREE.ShapeUtils.triangulateShape(pts2, []); } catch { continue; }
    for (const [a, b, c] of tris) {
      const A = V3[face[a]], B = V3[face[b]], C = V3[face[c]];
      batch.tri([A[0], A[1], A[2]], [B[0], B[1], B[2]], [C[0], C[1], C[2]], color, [uv(A), uv(B), uv(C)]);
    }
  }
  return V3.reduce((m, v) => (v[1] > m[1] ? v : m), V3[0]);
}

// Rectangular building with a gabled roof (used for terraced houses and the church)
export function gabled(walls, roofs, props, o, edges) {
  const { cx, cz, a, w, d, eaves, wall: wallCol, roofColor, chimney, base } = o;
  const f = frame(cx, cz, a);
  const y1 = base + eaves;
  const C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  const N = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const wc = col(wallCol), rc = col(roofColor);
  for (let i = 0; i < 4; i++) {
    const A = f.p(...C[i], 0), B = f.p(...C[(i + 1) % 4], 0);
    wall(walls, [A[0], A[2]], [B[0], B[2]], base, base - 2, y1, f.dir(...N[i]), wc, edges);
  }
  const ov = 0.35, rh = o.rh ?? Math.min(d * 0.42, 4.2);
  const e = (lx, lz) => f.p(lx, lz, y1 - 0.25);
  const S = Math.hypot(d / 2 + ov, rh), vt = eaves / V;
  const R0 = f.p(-w / 2 - ov, 0, y1 + rh), R1 = f.p(w / 2 + ov, 0, y1 + rh);
  const uvs = [[0, 0], [w / 3, 0], [w / 3, S / 1.1], [0, S / 1.1]];
  roofs.quad(e(-w / 2 - ov, -d / 2 - ov), e(w / 2 + ov, -d / 2 - ov), R1, R0, rc, uvs);
  roofs.quad(e(w / 2 + ov, d / 2 + ov), e(-w / 2 - ov, d / 2 + ov), R0, R1, rc, uvs);
  for (const sx of [-1, 1]) {
    const x = (sx * w) / 2;
    walls.tri(f.p(x, -d / 2, y1), f.p(x, d / 2, y1), f.p(x, 0, y1 + rh), wc, [[0, vt], [d / U, vt], [d / U / 2, vt + rh / V]], f.dir(sx, 0));
  }
  if (chimney) {
    const p = f.p((w / 2 - 0.6) * (chimney > 0.5 ? 1 : -1), 0, y1 + rh - 0.8);
    chimneyStack(props, p[0], p[1], p[2], -a);
  }
}

function chimneyStack(props, x, y, z, rot) {
  props.box(0.9, 1.9, 1.3, x, y, z, rot, col('#9a5442'));
  props.box(1.05, 0.18, 1.45, x, y + 1.9, z, rot, col('#b8a88f'));
  props.cylinder(0.14, 0.45, x - 0.2, y + 2.08, z, col('#b86b4b'), 6);
  props.cylinder(0.14, 0.45, x + 0.2, y + 2.08, z, col('#b86b4b'), 6);
}

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
      const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, long = u1 - u0 >= v1 - v0;
      best = { area, rect: [uc * c - vc * s, uc * s + vc * c, Math.max(u1 - u0, v1 - v0), Math.min(u1 - u0, v1 - v0), long ? a : a + Math.PI / 2] };
    }
  }
  return best.rect;
}

function inside(x, z, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// The medieval/Georgian core: Market Place, Bucklersbury, Sun St, Tilehouse St, High St, Bancroft, Churchyard
function historicCore(x, z) {
  if (Math.hypot(x - 30, z - 20) < 300) return true;
  if (x > -40 && x < 260 && z > -700 && z < -100 && Math.abs(x - (60 + (-z - 140) * 0.37)) < 70) return true; // Bancroft
  if (x > -330 && x < 0 && z > 100 && z < 330) return true;  // Tilehouse Street
  return false;
}

// ---------- Town ----------
export function buildTown() {
  const occ = new Occupancy(Math.max(HALF_W, HALF_H), 2);
  for (const s of DATA.segments) {
    if (s.t !== 'road' || s.tunnel) continue;
    occ.markPolyline(s.p, (ROAD_WIDTH[s.c] || 3) / 2 + (MAJOR.has(s.c) ? 2.2 : 0.4), 1);
  }
  for (const s of DATA.segments) if (s.t === 'rail') occ.markPolyline(s.p, 3, 1);
  for (const w of DATA.water.lines) occ.markPolyline(w.p, w.c === 'river' ? 5 : 2, 2);

  const STYLES = ['georgian', 'victorian', 'tudor', 'shop', 'modern', 'plain'];
  const walls = Object.fromEntries(STYLES.map((s) => [s, new Batch()]));
  const roofs = new Batch(), flats = new Batch(), props = new Batch();
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

    if (b.n === "St Mary's") { church(props, pts, base, edges); continue; }

    const cls = b.c || '';
    const small = SMALL.has(cls) || area < 22;
    const home = HOMES.has(cls) || (!cls && area < 160);
    const core = historicCore(cx, cz);
    const big = area > 900 || ['industrial', 'warehouse', 'retail', 'supermarket', 'school', 'college', 'hospital', 'sports_centre'].includes(cls) && area > 400;

    let style, wallCol;
    if (small) { style = 'plain'; wallCol = pick([['#c9bfb0', 1], ['#b3a595', 1], ['#d8d0c2', 1]], r); }
    else if (big) { style = 'modern'; wallCol = pick(MODERN, r); }
    else if (core && !home) { style = 'shop'; wallCol = pick(r() < 0.35 ? BRICK : RENDER, r); }
    else if (core) {
      const k = r();
      style = k < 0.18 ? 'tudor' : k < 0.62 ? 'georgian' : 'victorian';
      wallCol = style === 'tudor' ? pick(LIMEWASH, r) : style === 'georgian' ? pick(r() < 0.25 ? BRICK : RENDER, r) : pick(BRICK, r);
    } else if (home) {
      style = r() < 0.72 ? 'victorian' : 'georgian';
      wallCol = style === 'victorian' ? pick(BRICK, r) : pick(RENDER, r);
    } else { style = r() < 0.5 ? 'modern' : 'georgian'; wallCol = pick(style === 'modern' ? MODERN : RENDER, r); }
    const roofCol = pick(style === 'tudor' || (home && r() < 0.65) || (core && r() < 0.6) ? CLAY : SLATE, r);

    // Heights: use mapped values where we have them
    const pitch = big ? 0.45 : 0.8, cap = big ? 2.5 : home ? 4.4 : 5;
    const maxT = b.sk ? Math.max(...b.sk.v.map((v) => v[2])) : 0;
    const roofH = b.sk ? Math.min(maxT * pitch, cap) : 0;
    let total = b.h || (b.f ? b.f * FLOOR + roofH + 0.4 : 0), eaves;
    if (small) eaves = Math.min(total || 2.6, 3);
    else if (total) eaves = Math.max(2.8, total - roofH);
    else if (home) eaves = cls === 'apartments' ? 9.6 : area > 90 && r() < 0.15 ? 8.2 : 5.8;
    else if (big) eaves = cls === 'industrial' || cls === 'warehouse' ? 7 : 8.5;
    else eaves = core ? (r() < 0.5 ? 9.8 : 6.6) : 6.6;

    const wc = col(wallCol), rc = col(roofCol);
    const rect = b.rr;
    const terrace = home && rect && rect[3] < 11 && r() < 0.55;
    if (terrace) {
      gabled(walls[style], roofs, props, { cx: rect[0], cz: rect[1], w: rect[2], d: rect[3], a: rect[4], eaves, base, wall: wallCol, roofColor: roofCol, chimney: r() < 0.8 ? r() : 0 }, edges);
    } else if (b.sk && !small) {
      footprintWalls(walls[style], pts, base, base + eaves, wc, edges);
      const peak = skeletonRoof(roofs, b.sk, base + eaves, pitch, cap, rc);
      if ((home || core) && r() < 0.55 && roofH > 2) chimneyStack(props, peak[0], peak[1] - 0.9, peak[2], r() * 3);
    } else {
      footprintWalls(walls[style], pts, base, base + eaves, wc, small ? null : edges);
      flatRoof(flats, pts, base + eaves, col(pick(FLAT, r)));
    }
  }

  const group = new THREE.Group();
  const wallMats = {};
  STYLES.forEach((style, i) => {
    wallMats[style] = wallMaterial(style, 3 + i * 7);
    const mesh = new THREE.Mesh(walls[style].build(), wallMats[style]);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });
  const add = (batch, mat) => { const mesh = new THREE.Mesh(batch.build(), mat); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); };
  add(roofs, new THREE.MeshStandardMaterial({ vertexColors: true, map: roofTexture(), roughness: 0.82, side: THREE.DoubleSide }));
  add(flats, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
  add(props, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }));

  return { group, occ, edges, wallMats };
}

// St Mary's: flint-and-clunch walls, lead roofs, and the west tower with its Hertfordshire spike.
function church(props, pts, base, edges) {
  const stone = '#c4bca8', lead = '#7b8288';
  footprintWalls(props, pts, base, base + 7.5, col(stone), edges);
  flatRoof(props, pts, base + 7.5, col(lead));
  const [cx, cz, L, D, a] = minRect(pts);
  gabled(props, props, props, { cx, cz, w: L * 0.84, d: D * 0.45, a, eaves: 11, base, wall: stone, roofColor: lead, rh: 3.4 });
  const dir = [Math.cos(a), Math.sin(a)];
  const west = dir[0] < 0 ? 1 : -1;
  const tx = cx + dir[0] * west * (L / 2 - 4.5), tz = cz + dir[1] * west * (L / 2 - 4.5);
  const f = frame(tx, tz, a);
  const C = [[-4.5, -4.5], [4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]].map(([x, z]) => { const p = f.p(x, z, 0); return [p[0], p[2]]; });
  footprintWalls(props, C, base, base + 24, col(stone));
  flatRoof(props, C, base + 24, col(lead));
  for (let k = -4; k <= 4; k += 2) for (const [lx, lz] of [[k, -4.3], [k, 4.3], [-4.3, k], [4.3, k]]) {
    const p = f.p(lx, lz, base + 24);
    props.box(1, 1.2, 1, p[0], p[1], p[2], -a, col(stone));
  }
  props.cylinder(1.6, 7, tx, base + 24.3, tz, col(lead), 8, 0);
  // clock face and belfry openings
  for (const [lx, lz, ny] of [[0, -4.55, 0], [0, 4.55, Math.PI], [-4.55, 0, Math.PI / 2], [4.55, 0, -Math.PI / 2]]) {
    const p = f.p(lx, lz, base + 19);
    props.box(0.5, 2.6, 1.3, p[0], p[1], p[2], -a + ny + Math.PI / 2, col('#3b3f42'));
  }
}
