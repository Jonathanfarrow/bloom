import * as THREE from 'three';
import { Batch, col } from './batch.js';
import { DATA, HALF_W, HALF_H, groundHeight, ROAD_WIDTH, MAJOR } from './geo.js';
import { Path } from './util.js';

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

// Land-use colours for the painted ground
const LAND = {
  park: '#86b85c', recreation_ground: '#86b85c', village_green: '#86b85c', garden: '#8cbc62', grass: '#8fbd63',
  pitch: '#74ad4d', playground: '#d9c08f', stadium: '#74ad4d', golf_course: '#8fc566',
  wood: '#5f8f45', forest: '#5f8f45', scrub: '#7e9d57', meadow: '#a4bf6b', grassland: '#a1bd69', heath: '#9fae6b',
  farmland: '#c6c07e', farmyard: '#bdb393', orchard: '#9cbb66', allotments: '#a9b96c',
  cemetery: '#86a868', grave_yard: '#86a868', religious: '#a9b98f',
  retail: '#c3bcae', commercial: '#c3bcae', industrial: '#bdb7aa', railway: '#b9ae9c', construction: '#c9b894', garages: '#c2bcb1',
  school: '#c6c9a6', college: '#c6c9a6', university: '#c6c9a6', kindergarten: '#c6c9a6', hospital: '#d0cbbc',
  pedestrian: '#d8ccb2', parking: '#b3aea4', water_park: '#9cc7d6',
};

const PATHS = new Set(['footway', 'path', 'cycleway', 'steps', 'bridleway', 'track']);

function paintGround(pxPerM) {
  const W = Math.round(HALF_W * 2 * pxPerM), H = Math.round(HALF_H * 2 * pxPerM);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.setTransform(pxPerM, 0, 0, pxPerM, HALF_W * pxPerM, HALF_H * pxPerM);
  const poly = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.closePath(); };
  const line = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); };

  // Grass base with a soft mottle
  g.fillStyle = '#8cb766';
  g.fillRect(-HALF_W, -HALF_H, HALF_W * 2, HALF_H * 2);
  for (let i = 0; i < 9000; i++) {
    const x = -HALF_W + Math.random() * HALF_W * 2, z = -HALF_H + Math.random() * HALF_H * 2;
    g.fillStyle = vnoise(x / 60, z / 60) > 0.5 ? 'rgba(170,190,100,0.10)' : 'rgba(70,120,50,0.10)';
    g.beginPath(); g.arc(x, z, 6 + Math.random() * 14, 0, Math.PI * 2); g.fill();
  }

  // Land use, biggest first so small features sit on top
  const areaOf = (p) => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); };
  const land = DATA.land.filter((l) => LAND[l.c]).sort((a, b) => areaOf(b.p) - areaOf(a.p));
  for (const l of land) {
    poly(l.p);
    g.fillStyle = LAND[l.c];
    g.fill();
    if (l.c === 'farmland' || l.c === 'allotments') {
      g.save(); g.clip();
      g.strokeStyle = 'rgba(90,80,40,0.12)'; g.lineWidth = l.c === 'allotments' ? 1.2 : 2;
      const [x0, z0] = l.p[0], ang = hash(x0, z0) * Math.PI, sp = l.c === 'allotments' ? 4 : 6;
      for (let k = -900; k < 900; k += sp) {
        g.beginPath();
        g.moveTo(x0 - Math.cos(ang) * 900 - Math.sin(ang) * k, z0 - Math.sin(ang) * 900 + Math.cos(ang) * k);
        g.lineTo(x0 + Math.cos(ang) * 900 - Math.sin(ang) * k, z0 + Math.sin(ang) * 900 + Math.cos(ang) * k);
        g.stroke();
      }
      g.restore();
    }
    if (l.c === 'pitch') { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.35; g.stroke(); }
  }

  // Water: banks, then open water
  g.lineCap = g.lineJoin = 'round';
  const ww = (w) => (w.c === 'river' ? 6 : w.c === 'stream' ? 3 : 1.6);
  for (const w of DATA.water.lines) { line(w.p); g.strokeStyle = '#5e8a47'; g.lineWidth = ww(w) + 3; g.stroke(); }
  for (const w of DATA.water.areas) { poly(w.p); g.fillStyle = w.c === 'swimming_pool' ? '#7fc6dc' : '#4f8fae'; g.fill(); }
  for (const w of DATA.water.lines) { line(w.p); g.strokeStyle = '#4f8fae'; g.lineWidth = ww(w); g.stroke(); }

  // Railways: ballast then rails
  const rails = DATA.segments.filter((s) => s.t === 'rail' && !s.tunnel);
  for (const s of rails) { line(s.p); g.strokeStyle = '#998e80'; g.lineWidth = 4.2; g.stroke(); }
  for (const s of rails) {
    line(s.p); g.strokeStyle = '#655d56'; g.lineWidth = 1.7; g.stroke();
    line(s.p); g.strokeStyle = '#a1968a'; g.lineWidth = 1.1; g.stroke();
  }

  const roads = DATA.segments.filter((s) => s.t === 'road' && !s.tunnel);
  for (const s of roads) {
    if (!PATHS.has(s.c)) continue;
    line(s.p); g.strokeStyle = s.c === 'track' ? '#bda985' : '#d8caa9'; g.lineWidth = ROAD_WIDTH[s.c] || 1.8; g.stroke();
  }
  const streets = roads.filter((s) => !PATHS.has(s.c));
  for (const s of streets) {
    if (!MAJOR.has(s.c)) continue;
    line(s.p); g.strokeStyle = '#cfc8ba'; g.lineWidth = (ROAD_WIDTH[s.c] || 6) + 4.2; g.stroke();
  }
  const order = ['pedestrian', 'service', 'unknown', 'living_street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk'];
  for (const s of streets.slice().sort((a, b) => order.indexOf(a.c) - order.indexOf(b.c))) {
    line(s.p);
    g.strokeStyle = s.c === 'pedestrian' ? '#dcd2bd' : s.c === 'service' ? '#85817b' : '#6d6a66';
    g.lineWidth = ROAD_WIDTH[s.c] || 5;
    g.stroke();
  }
  g.setLineDash([3, 4.5]); g.strokeStyle = 'rgba(245,242,232,0.85)'; g.lineWidth = 0.18;
  for (const s of streets) if (['primary', 'secondary', 'tertiary', 'trunk'].includes(s.c)) { line(s.p); g.stroke(); }
  g.setLineDash([]);

  // Soft footprint under every building so the wall bases look grounded
  g.fillStyle = 'rgba(80,70,60,0.35)';
  for (const b of DATA.buildings) { poly(b.p); g.fill(); }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildGround(renderer) {
  const group = new THREE.Group();
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const tex = paintGround(small ? 1.05 : 1.55);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const step = 8;
  const g = new THREE.PlaneGeometry(HALF_W * 2, HALF_H * 2, Math.round((HALF_W * 2) / step), Math.round((HALF_H * 2) / step));
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, groundHeight(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  ground.receiveShadow = true;
  ground.name = 'ground';
  group.add(ground);

  // Patchwork countryside beyond the mapped area
  const outer = new THREE.PlaneGeometry(9000, 9000, 180, 180);
  outer.rotateX(-Math.PI / 2);
  const op = outer.attributes.position;
  const colors = new Float32Array(op.count * 3);
  const FIELDS = ['#8db463', '#a4bd66', '#c8bf78', '#7aa35a', '#b3b778', '#96b66a', '#d2c68a'].map(col);
  const c = new THREE.Color();
  for (let i = 0; i < op.count; i++) {
    const x = op.getX(i), z = op.getZ(i);
    const beyond = Math.max(0, Math.max(Math.abs(x) / HALF_W, Math.abs(z) / HALF_H) - 1);
    op.setY(i, groundHeight(x, z) - 0.8 + beyond * 30 * (vnoise(x / 700, z / 700) - 0.4));
    const wob = vnoise(x / 80, z / 80) * 50;
    c.copy(FIELDS[Math.floor(hash(Math.floor((x + wob) / 190), Math.floor((z - wob) / 150)) * FIELDS.length)]);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  outer.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  outer.computeVertexNormals();
  const outerMesh = new THREE.Mesh(outer, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  outerMesh.receiveShadow = true;
  group.add(outerMesh);

  return { group, ground };
}

// Raised decks and stone parapets wherever a street crosses water or a path.
export function buildBridges() {
  const b = new Batch();
  const deck = col('#b7ab94'), parapet = col('#cdc2aa');
  const bridges = [];
  for (const s of DATA.segments) {
    if (!s.bridge || s.t !== 'road') continue;
    const path = new Path(s.p);
    if (path.length < 2) continue;
    const w = Math.max(3, (ROAD_WIDTH[s.c] || 5) + (MAJOR.has(s.c) ? 3 : 1));
    const pts = [];
    const n = Math.max(1, Math.ceil(path.length / 2));
    for (let k = 0; k <= n; k++) pts.push(path.at((path.length * k) / n));
    const y0 = groundHeight(pts[0].x, pts[0].z), y1 = groundHeight(pts[n].x, pts[n].z);
    const yAt = (k) => y0 + (y1 - y0) * (k / n) + 0.28;
    for (let k = 1; k <= n; k++) {
      const a = pts[k - 1], c2 = pts[k];
      const A = (o) => [a.x + a.nx * o, yAt(k - 1), a.z + a.nz * o];
      const C = (o) => [c2.x + c2.nx * o, yAt(k), c2.z + c2.nz * o];
      b.quad(A(-w / 2), A(w / 2), C(w / 2), C(-w / 2), deck, null, [0, 1, 0]);
      const len = Math.hypot(c2.x - a.x, c2.z - a.z), ang = Math.atan2(c2.z - a.z, c2.x - a.x);
      for (const side of [-1, 1]) {
        const mx = (a.x + c2.x) / 2 + a.nx * side * (w / 2), mz = (a.z + c2.z) / 2 + a.nz * side * (w / 2);
        b.box(len + 0.06, 1.05, 0.42, mx, (yAt(k - 1) + yAt(k)) / 2 - 0.1, mz, -ang, parapet);
      }
    }
    bridges.push({ name: s.n, cls: s.c, path, width: w, y0, y1 });
  }
  const mesh = new THREE.Mesh(b.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true;
  return { mesh, bridges };
}
