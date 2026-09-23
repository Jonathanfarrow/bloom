import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DATA, groundHeight, ROAD_WIDTH, MAJOR } from './geo.js';
import { Path, pointInPoly, polyBounds, rng } from './util.js';
import { BASKET_STREETS } from '../data/sites.js';

// Street furniture and people: heritage lamp posts, park benches and tiny
// figures, all instanced so thousands cost almost nothing.
const paint = (g, hex) => {
  g = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
};

export function buildProps(occ) {
  const r = rng(77);
  const group = new THREE.Group();
  const lamps = [], benches = [], people = [];
  const nearCentre = (x, z, d) => Math.hypot(x - 40, z + 40) < d;

  // Lamp posts along town-centre streets, alternating sides
  for (const s of DATA.segments) {
    if (s.t !== 'road' || !(MAJOR.has(s.c) || s.c === 'pedestrian') || BASKET_STREETS.has(s.n)) continue;
    const path = new Path(s.p);
    const off = (ROAD_WIDTH[s.c] || 6) / 2 + (s.c === 'pedestrian' ? 0.2 : 1.7);
    for (let t = 8, k = 0; t < path.length - 4; t += 24, k++) {
      const p = path.at(t);
      if (!nearCentre(p.x, p.z, 750)) continue;
      const side = k % 2 ? 1 : -1;
      const x = p.x + p.nx * off * side, z = p.z + p.nz * off * side;
      if (occ.get(x, z) === 4 || occ.get(x, z) === 5) continue;
      lamps.push([x, z]);
    }
  }
  // Benches along paths in parks and churchyards
  const parks = DATA.land.filter((l) => ['park', 'garden', 'grave_yard', 'village_green', 'recreation_ground', 'cemetery'].includes(l.c));
  for (const s of DATA.segments) {
    if (s.t !== 'road' || !['footway', 'path', 'pedestrian'].includes(s.c)) continue;
    const path = new Path(s.p);
    for (let t = 10; t < path.length - 5; t += 45) {
      const p = path.at(t);
      if (!parks.some((l) => pointInPoly(p.x, p.z, l.p))) continue;
      const side = r() < 0.5 ? 1 : -1;
      const x = p.x + p.nx * 2.1 * side, z = p.z + p.nz * 2.1 * side;
      if (occ.get(x, z) >= 4) continue;
      benches.push([x, z, Math.atan2(p.dz, p.dx) + (side > 0 ? Math.PI : 0)]);
    }
  }
  // People: on busy pavements and in the squares
  const squares = DATA.land.filter((l) => l.c === 'pedestrian');
  for (const l of squares) {
    const b = polyBounds(l.p);
    for (let i = 0; i < 60; i++) {
      const x = b.x0 + r() * (b.x1 - b.x0), z = b.z0 + r() * (b.z1 - b.z0);
      if (pointInPoly(x, z, l.p) && occ.get(x, z) !== 4 && occ.get(x, z) !== 5) people.push([x, z]);
    }
  }
  for (const s of DATA.segments) {
    if (s.t !== 'road' || !(MAJOR.has(s.c) || ['pedestrian', 'footway'].includes(s.c))) continue;
    const path = new Path(s.p);
    const off = (ROAD_WIDTH[s.c] || 2) / 2 + (MAJOR.has(s.c) ? 1.1 : 0);
    for (let t = r() * 10; t < path.length; t += 7 + r() * 16) {
      const p = path.at(t);
      if (!nearCentre(p.x, p.z, 420) || r() < 0.35) continue;
      const side = r() < 0.5 ? 1 : -1, o = off + (r() - 0.5) * (MAJOR.has(s.c) ? 1.2 : 1);
      const x = p.x + p.nx * o * side, z = p.z + p.nz * o * side;
      if (occ.get(x, z) !== 4 && occ.get(x, z) !== 5) people.push([x, z]);
    }
  }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });

  // Lamp: fluted pole, cross-arm and lantern
  const lampGeo = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 8).translate(0, 0.3, 0), '#1f2e27'),
    paint(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 6).translate(0, 2.4, 0), '#1f2e27'),
    paint(new THREE.BoxGeometry(0.5, 0.05, 0.05).translate(0, 4.25, 0), '#1f2e27'),
    paint(new THREE.CylinderGeometry(0.18, 0.12, 0.45, 6).translate(0, 4.72, 0), '#fff4d6'),
    paint(new THREE.ConeGeometry(0.26, 0.22, 6).translate(0, 5.05, 0), '#1f2e27'),
  ]);
  const lampMat = mat.clone();
  lampMat.emissive = new THREE.Color('#ffcf85');
  lampMat.emissiveIntensity = 0;
  const lampMesh = new THREE.InstancedMesh(lampGeo, lampMat, Math.max(1, lamps.length));
  lamps.forEach(([x, z], i) => { m.compose(v.set(x, groundHeight(x, z), z), q.identity(), sc.set(1, 1, 1)); lampMesh.setMatrixAt(i, m); });
  lampMesh.count = lamps.length;
  // Only the lantern glass should glow at dusk
  lampMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance *= step(0.9, vColor.r);\n#endif');
  };

  const benchGeo = mergeGeometries([
    paint(new THREE.BoxGeometry(1.7, 0.06, 0.45).translate(0, 0.45, 0), '#8a6a4a'),
    paint(new THREE.BoxGeometry(1.7, 0.4, 0.06).translate(0, 0.72, -0.22), '#8a6a4a'),
    paint(new THREE.BoxGeometry(0.06, 0.45, 0.45).translate(-0.75, 0.22, 0), '#2a2a2a'),
    paint(new THREE.BoxGeometry(0.06, 0.45, 0.45).translate(0.75, 0.22, 0), '#2a2a2a'),
  ]);
  const benchMesh = new THREE.InstancedMesh(benchGeo, mat, Math.max(1, benches.length));
  benches.forEach(([x, z, a], i) => { m.compose(v.set(x, groundHeight(x, z), z), q.setFromAxisAngle(up, -a), sc.set(1, 1, 1)); benchMesh.setMatrixAt(i, m); });
  benchMesh.count = benches.length;

  // People: a body tinted per person, and a head
  const bodyGeo = paint(new THREE.CylinderGeometry(0.2, 0.17, 1.15, 7).translate(0, 0.62, 0), '#ffffff');
  const headGeo = paint(new THREE.SphereGeometry(0.16, 8, 6).translate(0, 1.38, 0), '#e6c3a1');
  const bodies = new THREE.InstancedMesh(bodyGeo, mat, Math.max(1, people.length));
  const heads = new THREE.InstancedMesh(headGeo, mat, Math.max(1, people.length));
  const CLOTHES = ['#2f4b7c', '#a23b3b', '#3f6e4f', '#d9a441', '#6b4f8a', '#e0dcd2', '#2b2b2b', '#c46a3a', '#4f8fae'];
  const c = new THREE.Color();
  people.forEach(([x, z], i) => {
    m.compose(v.set(x, groundHeight(x, z), z), q.setFromAxisAngle(up, r() * 6.28), sc.set(1, 0.9 + r() * 0.2, 1));
    bodies.setMatrixAt(i, m); heads.setMatrixAt(i, m);
    bodies.setColorAt(i, c.set(CLOTHES[Math.floor(r() * CLOTHES.length)]));
  });
  bodies.count = heads.count = people.length;

  for (const mesh of [lampMesh, benchMesh, bodies, heads]) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }
  return { group, lampMat };
}
