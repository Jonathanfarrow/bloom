import * as THREE from 'three';
import { ROADS, GREENS, RIVER, HILL } from '../data/town.js';
import { groundHeight, Path, pointInPoly, polyBounds, rng } from './util.js';

const TREE_GREENS = ['#4f7d3a', '#5b8a3f', '#6a9644', '#44713a', '#789f4a', '#3f6b3c'];

export function buildTrees(occ) {
  const r = rng(99);
  const list = [];
  const ok = (x, z, allowGreen) => {
    const v = occ.get(x, z);
    return v === 0 || (allowGreen && v === 2);
  };
  const add = (x, z, s = 1, kind) => list.push({ x, z, s: s * (0.8 + r() * 0.45), kind: kind ?? (r() < 0.78 ? 0 : 1) });

  // Bancroft avenue
  const bancroft = ROADS.find((x) => x.name === 'Bancroft');
  const bp = new Path(bancroft.pts);
  for (let t = 20; t < bp.length - 10; t += 13) {
    const p = bp.at(t);
    for (const s of [-1, 1]) add(p.x + p.nx * 12.6 * s, p.z + p.nz * 12.6 * s, 1.05, 0);
  }
  // Parks: edges and scattered specimens
  for (const g of GREENS) {
    const b = polyBounds(g.pts);
    const area = (b.x1 - b.x0) * (b.z1 - b.z0);
    const n = Math.floor(area / 900);
    for (let i = 0; i < n; i++) {
      const x = b.x0 + r() * (b.x1 - b.x0), z = b.z0 + r() * (b.z1 - b.z0);
      if (!pointInPoly(x, z, g.pts)) continue;
      // keep lawns open in the middle of Bancroft Gardens and around the church
      if (g.name === 'Bancroft Gardens' && Math.hypot(x - 105, z + 345) < 34) continue;
      if (g.name === "St Mary's Churchyard" && (Math.abs(z - 20) < 32 && x > 55 && x < 150)) continue;
      if (g.name === 'Butts Close' && r() < 0.6) continue;
      add(x, z, 1.1);
    }
  }
  // Riverside willows/alders
  const rp = new Path(RIVER.pts);
  for (let t = 0; t < rp.length; t += 11 + r() * 12) {
    const p = rp.at(t), s = r() < 0.5 ? -1 : 1, o = RIVER.w / 2 + 3 + r() * 4;
    const x = p.x + p.nx * o * s, z = p.z + p.nz * o * s;
    if (occ.get(x, z) !== 1) add(x, z, 1.15, 0);
  }
  // Crown of trees on top of Windmill Hill
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2, d = 20 + r() * 45;
    const x = HILL.x + 25 + Math.cos(a) * d, z = HILL.z + Math.sin(a) * d;
    if (x < HILL.x - 5 && z > 0 && z < 170) continue; // leave the lavender slope open
    add(x, z, 1.1);
  }
  // Gardens behind houses
  for (let i = 0; i < 2600; i++) {
    const x = -650 + r() * 1300, z = -650 + r() * 1300;
    if (!ok(x, z, false)) continue;
    // only near existing buildings (backs of plots), not out in open fields
    let near = false;
    for (let k = 0; k < 6 && !near; k++) {
      const a = (k / 6) * Math.PI * 2;
      if (occ.get(x + Math.cos(a) * 14, z + Math.sin(a) * 14) === 4) near = true;
    }
    if (!near && r() < 0.93) continue;
    add(x, z, 0.8 + r() * 0.3);
    occ.set(x, z, 3);
  }
  // Hedgerow trees out in the fields
  for (let i = 0; i < 240; i++) {
    const a = r() * Math.PI * 2, d = 680 + r() * 520;
    add(40 + Math.cos(a) * d, -20 + Math.sin(a) * d, 1.2);
  }

  // Instanced meshes
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.35, 1, 6).translate(0, 0.5, 0);
  const roundGeo = new THREE.IcosahedronGeometry(1, 0);
  const coneGeo = new THREE.ConeGeometry(1, 2.4, 7).translate(0, 0.9, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b5140', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  const rounds = list.filter((t) => t.kind === 0), cones = list.filter((t) => t.kind === 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
  const crownR = new THREE.InstancedMesh(roundGeo, leafMat, Math.max(1, rounds.length * 2));
  const crownC = new THREE.InstancedMesh(coneGeo, leafMat, Math.max(1, cones.length));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const c = new THREE.Color();
  let ir = 0, ic = 0;
  list.forEach((t, i) => {
    const y = groundHeight(t.x, t.z);
    const H = 4.2 * t.s;
    m.compose(v.set(t.x, y - 0.3, t.z), q.identity(), sc.set(t.s, H, t.s));
    trunks.setMatrixAt(i, m);
    c.set(TREE_GREENS[Math.floor(r() * TREE_GREENS.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06);
    q.setFromAxisAngle(v.set(0, 1, 0), r() * 6.28);
    if (t.kind === 0) {
      const R = 3.6 * t.s;
      m.compose(v.set(t.x, y + H + R * 0.55, t.z), q, sc.set(R, R * 0.9, R));
      crownR.setMatrixAt(ir, m); crownR.setColorAt(ir++, c);
      m.compose(v.set(t.x + R * 0.35, y + H + R * 1.05, t.z - R * 0.2), q, sc.set(R * 0.7, R * 0.65, R * 0.7));
      crownR.setMatrixAt(ir, m); crownR.setColorAt(ir++, c.offsetHSL(0, 0, 0.04));
    } else {
      const R = 2.6 * t.s;
      m.compose(v.set(t.x, y + H * 0.6, t.z), q, sc.set(R, R * 2.2, R));
      crownC.setMatrixAt(ic, m); crownC.setColorAt(ic++, c.offsetHSL(0, 0.02, -0.05));
    }
  });
  crownR.count = ir; crownC.count = ic;
  const group = new THREE.Group();
  for (const mesh of [trunks, crownR, crownC]) {
    mesh.castShadow = mesh.receiveShadow = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }
  return group;
}
