import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SCHEMES } from '../data/sites.js';

// Shared uniforms drive growth, wind and scheme-change animations in the shader.
export const flowerUniforms = {
  uBloom: { value: 1 },
  uRegrow: { value: 1 },
  uTime: { value: 0 },
  uWind: { value: 1 },
};

function paint(g, r, gc, b) {
  const g2 = g.index ? g.toNonIndexed() : g;
  const n = g2.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = gc; c[i * 3 + 2] = b; }
  g2.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g2.deleteAttribute('uv');
  return g2;
}

function star(points = 8, rOut = 0.5, rIn = 0.18) {
  const pos = [];
  const n = points * 2;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const r0 = i % 2 ? rIn : rOut, r1 = (i + 1) % 2 ? rIn : rOut;
    pos.push(0, 0.02, 0, Math.cos(a1) * r1, r1 === rOut ? 0.1 : 0.04, Math.sin(a1) * r1, Math.cos(a0) * r0, r0 === rOut ? 0.1 : 0.04, Math.sin(a0) * r0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function makeGeometries() {
  const G = {};
  const center = paint(new THREE.ConeGeometry(0.16, 0.12, 6).translate(0, 0.1, 0), 1.0, 0.78, 0.22);
  G.daisy = mergeGeometries([paint(star(), 1, 1, 1), center]);
  G.cup = paint(new THREE.LatheGeometry([new THREE.Vector2(0.02, 0), new THREE.Vector2(0.3, 0.12), new THREE.Vector2(0.42, 0.42), new THREE.Vector2(0.36, 0.62)], 6), 1, 1, 1);
  G.ball = paint(new THREE.IcosahedronGeometry(0.5, 0), 1, 1, 1);
  G.spike = mergeGeometries([0, 1, 2, 3].map((i) => paint(new THREE.OctahedronGeometry(0.22 - i * 0.035).scale(1, 1.3, 1).translate(0, 0.15 + i * 0.24, 0), 1, 1, 1)));
  G.tiny = mergeGeometries([[0, 0.25, 0], [0.28, 0.12, 0.05], [-0.22, 0.14, 0.2], [0.02, 0.12, -0.3], [-0.2, 0.1, -0.15]].map(([x, y, z]) => paint(new THREE.OctahedronGeometry(0.2).translate(x, y, z), 1, 1, 1)));
  G.foliage = mergeGeometries([0, 1, 2, 3, 4].map((i) => {
    const c = new THREE.ConeGeometry(0.07, 1, 3).translate(0, 0.5, 0);
    c.rotateZ(0.25 + (i % 2) * 0.12); c.rotateY((i / 5) * Math.PI * 2);
    return paint(c, 1, 1, 1);
  }));
  G.stem = paint(new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, true).translate(0, 0.5, 0), 1, 1, 1);
  G.leaf = paint(new THREE.IcosahedronGeometry(0.5, 0).scale(1, 0.62, 1).translate(0, 0.2, 0), 1, 1, 1);
  return G;
}

function makeMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, side: THREE.DoubleSide });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, flowerUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aDelay; attribute float aBase; attribute float aFresh;
uniform float uBloom; uniform float uRegrow; uniform float uTime; uniform float uWind;`)
      .replace('#include <project_vertex>', `
vec4 mvPosition = vec4( transformed, 1.0 );
vec3 ip = vec3(0.0);
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  ip = vec3(instanceMatrix[3][0], aBase, instanceMatrix[3][2]);
#endif
float grow = smoothstep(aDelay, aDelay + 0.35, uBloom);
grow *= mix(1.0, smoothstep(aDelay * 0.8, aDelay * 0.8 + 0.35, uRegrow), aFresh);
mvPosition.xyz = ip + (mvPosition.xyz - ip) * grow;
float hgt = max(mvPosition.y - aBase, 0.0);
float ph = uTime * 1.7 + ip.x * 0.35 + ip.z * 0.27;
mvPosition.x += sin(ph) * hgt * 0.08 * uWind;
mvPosition.z += cos(ph * 0.8) * hgt * 0.06 * uWind;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
  };
  return m;
}

const LEAF_GREENS = ['#3f7a3a', '#4b8740', '#35693a', '#58913f'].map((h) => new THREE.Color(h));
const SILVER_GREENS = ['#7d9a7d', '#8aa58a', '#6f8f72'].map((h) => new THREE.Color(h));

const HEAD = {
  daisy: { s: 0.34, at: 1 }, cup: { s: 0.34, at: 1 }, ball: { s: 0.36, at: 1 },
  spike: { s: 0.36, sy: 0.9, at: 0.5 }, tiny: { s: 0.44, at: 0.45, noStem: true }, foliage: { base: true },
};

export class FlowerField {
  constructor(capacity) {
    this.group = new THREE.Group();
    this.meshes = {};
    const geos = makeGeometries();
    const mat = makeMaterial();
    const caps = { leaf: capacity, stem: capacity };
    for (const k of Object.keys(HEAD)) caps[k] = k === 'spike' ? capacity * 4 : capacity;
    for (const [k, cap] of Object.entries(caps)) {
      const g = geos[k];
      for (const name of ['aDelay', 'aBase', 'aFresh']) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(cap), 1));
      const mesh = new THREE.InstancedMesh(g, mat, cap);
      mesh.setColorAt(0, new THREE.Color());
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.receiveShadow = true;
      this.meshes[k] = mesh;
      this.group.add(mesh);
    }
  }

  // sites: [{ id, slots }], schemeOf(id) → scheme key
  rebuild(sites, schemeOf, freshId) {
    const counts = Object.fromEntries(Object.keys(this.meshes).map((k) => [k, 0]));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const c = new THREE.Color();
    const push = (key, x, y, z, sx, sy, sz, rotY, tilt, color, slot, fresh) => {
      const mesh = this.meshes[key];
      const i = counts[key]++;
      if (i >= mesh.instanceMatrix.count) return;
      e.set(tilt * Math.cos(rotY * 3), rotY, tilt * Math.sin(rotY * 3));
      m.compose(v.set(x, y, z), q.setFromEuler(e), s.set(sx, sy, sz));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, color);
      const g = mesh.geometry.attributes;
      g.aDelay.array[i] = slot.delay;
      g.aBase.array[i] = slot.y;
      g.aFresh.array[i] = fresh;
    };

    for (const site of sites) {
      const scheme = SCHEMES[schemeOf(site.id)];
      const plants = scheme.plants;
      const cum = [];
      let acc = 0;
      for (const p of plants) { acc += p.share; cum.push(acc); }
      const fresh = site.id === freshId ? 1 : 0;
      const silver = schemeOf(site.id) === 'lavender';
      for (const slot of site.slots) {
        let plant;
        if (slot.band >= 0) plant = plants[slot.band % plants.length];
        else {
          const x = slot.r * acc;
          plant = plants[cum.findIndex((cv) => x <= cv)] || plants[0];
        }
        const S = slot.s ?? 1;
        const H = plant.h * (slot.hm ?? 1) * (0.8 + slot.r2 * 0.4);
        const rot = slot.r3 * Math.PI * 2;
        const form = HEAD[plant.form];
        c.set(plant.color).offsetHSL(0, 0, (slot.r2 - 0.5) * 0.08);
        if (form.base) {
          push('foliage', slot.x, slot.y, slot.z, 0.7 * S, H, 0.7 * S, rot, 0, c, slot, fresh);
          continue;
        }
        const leafCol = (silver ? SILVER_GREENS : LEAF_GREENS)[Math.floor(slot.r3 * 3.99) % 3];
        const cushion = plant.form === 'spike' ? 1.5 : 1;
        push('leaf', slot.x, slot.y, slot.z, 0.34 * S * cushion, (0.2 + H * 0.35) * S * cushion, 0.34 * S * cushion, rot, 0, leafCol, slot, fresh);
        const headY = slot.y + H * form.at;
        if (!form.noStem) push('stem', slot.x, slot.y, slot.z, 0.05, headY - slot.y, 0.05, rot, 0, LEAF_GREENS[1], slot, fresh);
        const hs = form.s * S * (0.85 + slot.r * 0.3);
        if (plant.form === 'spike') {
          // a cushion of flower spikes, like a lavender bush
          const n = S > 1.1 ? 4 : 2;
          for (let k = 0; k < n; k++) {
            const a = rot + (k / n) * Math.PI * 2, d = 0.13 * S * (k ? 1 : 0.2);
            push('spike', slot.x + Math.cos(a) * d, headY - k * 0.03 * S, slot.z + Math.sin(a) * d, hs * 0.8, hs * Math.max(1, H / 0.35) * (0.8 + 0.1 * k), hs * 0.8, a, (k ? 0.35 : 0.05), c, slot, fresh);
          }
          continue;
        }
        push(plant.form, slot.x, headY, slot.z, hs, hs * (form.sy ?? 1), hs, rot, (slot.r2 - 0.5) * 0.5, c, slot, fresh);
      }
    }
    for (const [k, mesh] of Object.entries(this.meshes)) {
      mesh.count = Math.min(counts[k], mesh.instanceMatrix.count);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      for (const name of ['aDelay', 'aBase', 'aFresh']) mesh.geometry.attributes[name].needsUpdate = true;
    }
    return counts;
  }
}
