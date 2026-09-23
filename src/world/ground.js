import * as THREE from 'three';
import { ROADS, RIVER, GREENS, PLAZA, ROUNDABOUT, HILL } from '../data/town.js';
import { Batch, col } from './batch.js';
import { groundHeight, Path } from './util.js';

const Y = { bank: 0.03, water: 0.045, green: 0.03, pave: 0.06, verge: 0.075, road: 0.095, line: 0.11, plaza: 0.085 };

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const FIELD_COLOURS = ['#8db463', '#a4bd66', '#c8bf78', '#7aa35a', '#b3b778', '#96b66a', '#d2c68a'].map(col);

export function buildGround() {
  const size = 2600, seg = 300;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const town = col('#86ad5f'), lush = col('#79a653'), dry = col('#9bb56c');
  const c = new THREE.Color(), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, groundHeight(x, z) - 0.02);
    const n = vnoise(x / 40, z / 40) * 0.6 + vnoise(x / 9, z / 9) * 0.4;
    c.copy(town).lerp(n > 0.5 ? dry : lush, Math.abs(n - 0.5) * 1.4);
    // Patchwork farmland beyond the town
    const r = Math.hypot(x - 40, z + 20);
    if (r > 640) {
      const wob = vnoise(x / 60, z / 60) * 40;
      const fx = Math.floor((x + wob) / 150), fz = Math.floor((z - wob) / 115);
      tmp.copy(FIELD_COLOURS[Math.floor(hash(fx, fz) * FIELD_COLOURS.length)]);
      const stripe = Math.sin((x * 0.7 + z * 0.3) * (hash(fz, fx) > 0.5 ? 1 : 0.4)) * 0.03;
      tmp.offsetHSL(0, 0, stripe);
      c.lerp(tmp, Math.min(1, (r - 640) / 120));
    }
    const hd = Math.hypot(x - HILL.x, z - HILL.z);
    if (hd < 130) c.lerp(lush, (1 - hd / 130) * 0.5);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  mesh.receiveShadow = true;
  mesh.name = 'ground';
  return mesh;
}

function densify(pts, step = 5) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
  }
  return out;
}

// Ribbon between two offsets from a polyline, draped over the terrain.
export function ribbon(batch, pts, o0, o1, y, color) {
  const d = densify(pts);
  const norms = d.map((p, i) => {
    const a = d[Math.max(0, i - 1)], b = d[Math.min(d.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), nz = b[0] - a[0];
    const l = Math.hypot(nx, nz) || 1;
    return [nx / l, nz / l];
  });
  const up = [0, 1, 0];
  for (let i = 1; i < d.length; i++) {
    const v = (j, o) => {
      const x = d[j][0] + norms[j][0] * o, z = d[j][1] + norms[j][1] * o;
      return [x, groundHeight(x, z) + y, z];
    };
    batch.quad(v(i - 1, o0), v(i - 1, o1), v(i, o1), v(i, o0), color, null, up);
  }
}

function disc(batch, x, z, r, y, color, seg = 24) {
  const up = [0, 1, 0];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const p = (a) => { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; return [px, groundHeight(px, pz) + y, pz]; };
    batch.tri([x, groundHeight(x, z) + y, z], p(a0), p(a1), color, undefined, up);
  }
}

function paintTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
  // York-stone style flags
  x.strokeStyle = 'rgba(80,70,55,0.35)'; x.lineWidth = 2;
  for (let r = 0; r < 4; r++) {
    const off = (r % 2) * 20;
    x.beginPath(); x.moveTo(0, r * 32); x.lineTo(128, r * 32); x.stroke();
    for (let k = -1; k < 4; k++) { x.beginPath(); x.moveTo(off + k * 40, r * 32); x.lineTo(off + k * 40, r * 32 + 32); x.stroke(); }
  }
  for (let i = 0; i < 400; i++) {
    x.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    x.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function buildStreets() {
  const group = new THREE.Group();
  const flat = new Batch();
  const asphalt = col('#6a6763'), resAsphalt = col('#77736e'), pavement = col('#cbc3b4'), verge = col('#6e9d4c');
  const line = col('#efeae0'), water = col('#4d8ea6'), bank = col('#5f8a45'), green = col('#74a24f');

  for (const g of GREENS) {
    const s = new THREE.Shape(g.pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const sg = new THREE.ShapeGeometry(s);
    sg.rotateX(-Math.PI / 2);
    sg.translate(0, Y.green, 0);
    flat.add(sg, new THREE.Matrix4(), green);
    sg.dispose();
  }

  // River
  ribbon(flat, RIVER.pts, -RIVER.w / 2 - 2.2, RIVER.w / 2 + 2.2, Y.bank, bank);
  const waterBatch = new Batch();
  ribbon(waterBatch, RIVER.pts, -RIVER.w / 2, RIVER.w / 2, Y.water, water);

  for (const r of ROADS) {
    const half = r.w / 2, pave = r.pave ?? (r.res ? 2 : 2.5);
    ribbon(flat, r.pts, -half - pave, half + pave, Y.pave, pavement);
    if (r.verge) {
      ribbon(flat, r.pts, half + 0.3, half + pave - 3.5, Y.verge, verge);
      ribbon(flat, r.pts, -half - pave + 3.5, -half - 0.3, Y.verge, verge);
    }
    ribbon(flat, r.pts, -half, half, Y.road, r.res ? resAsphalt : asphalt);
    for (const end of [r.pts[0], r.pts[r.pts.length - 1]]) {
      disc(flat, end[0], end[1], half + pave, Y.pave - 0.004, pavement);
      disc(flat, end[0], end[1], half, Y.road - 0.004, r.res ? resAsphalt : asphalt);
    }
    // Dashed centre line on the main streets
    if (!r.res && r.w >= 10 && r.name !== 'Churchyard') {
      const path = new Path(r.pts);
      for (let t = 14; t < path.length - 14; t += 7) {
        const a = path.at(t), b = path.at(Math.min(path.length, t + 3));
        ribbon(flat, [[a.x, a.z], [b.x, b.z]], -0.1, 0.1, Y.line, line);
      }
    }
  }

  // Roundabout
  disc(flat, ROUNDABOUT.x, ROUNDABOUT.z, ROUNDABOUT.r + 2.5, Y.pave + 0.01, pavement, 40);
  disc(flat, ROUNDABOUT.x, ROUNDABOUT.z, ROUNDABOUT.r, Y.road + 0.01, asphalt, 40);
  disc(flat, ROUNDABOUT.x, ROUNDABOUT.z, ROUNDABOUT.island + 0.5, Y.line + 0.02, pavement, 40);
  disc(flat, ROUNDABOUT.x, ROUNDABOUT.z, ROUNDABOUT.island, Y.line + 0.05, green, 40);

  const flatMesh = new THREE.Mesh(flat.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
  flatMesh.receiveShadow = true;
  group.add(flatMesh);

  const waterMesh = new THREE.Mesh(waterBatch.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.1, side: THREE.DoubleSide }));
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Market Place paving
  const w = PLAZA.x1 - PLAZA.x0 + 5, d = PLAZA.z1 - PLAZA.z0 + 5;
  const pg = new THREE.PlaneGeometry(w, d);
  pg.rotateX(-Math.PI / 2);
  const uv = pg.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 8), uv.getY(i) * (d / 8));
  const plaza = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: '#dcd1bd', map: paintTexture(), roughness: 0.9 }));
  plaza.position.set((PLAZA.x0 + PLAZA.x1) / 2, Y.plaza + 0.02, (PLAZA.z0 + PLAZA.z1) / 2);
  plaza.receiveShadow = true;
  group.add(plaza);

  return group;
}
