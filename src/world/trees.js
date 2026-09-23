import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DATA, HALF_W, HALF_H, groundHeight } from './geo.js';
import { pointInPoly, polyBounds, polyArea, rng } from './util.js';
import { SURVEYED_TREES } from '../data/parkTrees.js';

const TREE_GREENS = ['#5e8f45', '#6c9a4a', '#7aa652', '#57864a', '#86ab58', '#4f7d44', '#93b25f'];
const DENSITY = { wood: 90, forest: 90, scrub: 160, park: 700, recreation_ground: 900, cemetery: 350, grave_yard: 300, garden: 400, village_green: 900, school: 1400, meadow: 2500, grassland: 2500 };

// Trees from the map where they are mapped individually, plus scattered trees in
// woods, parks and back gardens (kept off buildings, streets and flower beds).
export function buildTrees(occ) {
  const r = rng(99);
  const list = [];
  const free = (x, z, pad = 2.5) => {
    for (const [dx, dz] of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (occ.get(x + dx, z + dz)) return false;
    return true;
  };
  const add = (x, z, s = 1, kind) => {
    list.push({ x, z, s: s * (0.8 + r() * 0.45), kind: kind ?? (r() < 0.8 ? 0 : 1) });
    occ.set(x, z, 3);
  };

  for (const [x, z] of DATA.trees) if (occ.get(x, z) !== 4) add(x, z, 1.05, 0);
  // Hand-surveyed parks: exact trees, sized to their crowns, and no random extras
  for (const list of Object.values(SURVEYED_TREES)) for (const [x, z, R, kind] of list) if (occ.get(x, z) !== 4) add(x, z, (R / 4.2) / 1.02, kind);

  for (const l of DATA.land) {
    const per = DENSITY[l.c];
    if (!per || SURVEYED_TREES[l.n]) continue;
    const b = polyBounds(l.p);
    const n = Math.min(1500, Math.floor(polyArea(l.p) / per));
    for (let i = 0; i < n * 1.6; i++) {
      const x = b.x0 + r() * (b.x1 - b.x0), z = b.z0 + r() * (b.z1 - b.z0);
      if (!pointInPoly(x, z, l.p) || !free(x, z, 3)) continue;
      // parks: mostly round the edges, leaving open lawns
      if (per >= 350 && r() < 0.5) continue;
      add(x, z, l.c === 'wood' || l.c === 'forest' ? 1.15 : 1.1, l.c === 'wood' || l.c === 'forest' ? (r() < 0.65 ? 0 : 1) : undefined);
    }
  }
  // Back gardens: open ground a few metres from houses
  for (let i = 0; i < 26000; i++) {
    const x = (r() * 2 - 1) * HALF_W * 0.95, z = (r() * 2 - 1) * HALF_H * 0.95;
    if (!free(x, z, 4)) continue;
    let near = false;
    for (let k = 0; k < 6 && !near; k++) {
      const a = (k / 6) * Math.PI * 2;
      if (occ.get(x + Math.cos(a) * 12, z + Math.sin(a) * 12) === 4) near = true;
    }
    if (!near || r() < 0.55) continue;
    add(x, z, 0.72 + r() * 0.3);
  }

  // Fluffy model-railway crowns: a few lumpy blobs merged, darker underneath
  const blob = (x, y, z, r, seed, detail = 0) => {
    const g = new THREE.IcosahedronGeometry(r, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
      const n = 1 + 0.16 * Math.sin(vx * 3.1 + seed) * Math.cos(vz * 2.7 + seed) + 0.08 * Math.sin(vy * 4.3 + seed * 2);
      p.setXYZ(i, vx * n + x, vy * n * 0.9 + y, vz * n + z);
    }
    return g;
  };
  const shade = (g) => {
    const p = g.attributes.position, c = new Float32Array(p.count * 3);
    g.computeBoundingBox();
    const { min, max } = g.boundingBox;
    for (let i = 0; i < p.count; i++) {
      const k = 0.62 + 0.38 * ((p.getY(i) - min.y) / (max.y - min.y));
      c.set([k, k, k * 0.95], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  };
  const merge = (parts) => shade(mergeGeometries(parts.map((g) => g.toNonIndexed())));
  const roundGeo = merge([blob(0, 0, 0, 1, 1, 1), blob(0.55, 0.35, 0.2, 0.7, 2), blob(-0.5, 0.3, -0.25, 0.72, 3), blob(0.05, 0.75, 0.1, 0.62, 4), blob(-0.1, 0.1, 0.6, 0.6, 5)]);
  roundGeo.computeVertexNormals();
  const coneGeo = merge([0, 1, 2, 3].map((k) => new THREE.ConeGeometry(1 - k * 0.2, 1.1, 8).translate(0, 0.35 + k * 0.55, 0)));
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.34, 1, 6).translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6e5646', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.9, vertexColors: true, flatShading: true });
  const rounds = list.filter((t) => t.kind === 0).length;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
  const crownR = new THREE.InstancedMesh(roundGeo, leafMat, Math.max(1, rounds));
  const crownC = new THREE.InstancedMesh(coneGeo, leafMat, Math.max(1, list.length - rounds));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const c = new THREE.Color();
  let ir = 0, ic = 0;
  list.forEach((t, i) => {
    const y = groundHeight(t.x, t.z);
    const H = 3.6 * t.s;
    m.compose(v.set(t.x, y - 0.3, t.z), q.identity(), sc.set(t.s, H, t.s));
    trunks.setMatrixAt(i, m);
    c.set(TREE_GREENS[Math.floor(r() * TREE_GREENS.length)]).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08);
    q.setFromAxisAngle(v.set(0, 1, 0), r() * 6.28);
    if (t.kind === 0) {
      const R = 3.1 * t.s;
      m.compose(v.set(t.x, y + H + R * 0.5, t.z), q, sc.set(R, R * (0.85 + r() * 0.3), R));
      crownR.setMatrixAt(ir, m); crownR.setColorAt(ir++, c);
    } else {
      const R = 2.3 * t.s;
      m.compose(v.set(t.x, y + H * 0.45, t.z), q, sc.set(R, R * 3.2, R));
      crownC.setMatrixAt(ic, m); crownC.setColorAt(ic++, c.offsetHSL(0, 0.02, -0.06));
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
