import * as THREE from 'three';

// Accumulates flat-shaded, vertex-coloured triangles into one BufferGeometry.
export class Batch {
  constructor() {
    this.pos = []; this.nor = []; this.col = []; this.uv = [];
  }
  tri(a, b, c, color, uvs = [[0, 0], [0, 0], [0, 0]], normal) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const g = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    let n = normal;
    if (!n) {
      const l = Math.hypot(g[0], g[1], g[2]) || 1;
      n = [g[0] / l, g[1] / l, g[2] / l];
      if (n[1] < -0.01) n = [-n[0], -n[1], -n[2]];
    }
    // Wind the triangle so its front face matches the intended normal
    if (g[0] * n[0] + g[1] * n[1] + g[2] * n[2] < 0) {
      [b, c] = [c, b];
      uvs = [uvs[0], uvs[2], uvs[1]];
    }
    for (const [p, t] of [[a, uvs[0]], [b, uvs[1]], [c, uvs[2]]]) {
      this.pos.push(p[0], p[1], p[2]);
      this.nor.push(n[0], n[1], n[2]);
      this.col.push(color.r, color.g, color.b);
      this.uv.push(t[0], t[1]);
    }
  }
  quad(a, b, c, d, color, uvs, normal) {
    const u = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
    this.tri(a, b, c, color, [u[0], u[1], u[2]], normal);
    this.tri(a, c, d, color, [u[0], u[2], u[3]], normal);
  }
  // Append an existing geometry, transformed by a Matrix4, painted one colour.
  add(geometry, matrix, color) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.applyMatrix4(matrix);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const uv = g.attributes.uv ? g.attributes.uv.array : null;
    for (let i = 0; i < p.length / 3; i++) {
      this.pos.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
      this.nor.push(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]);
      this.col.push(color.r, color.g, color.b);
      this.uv.push(uv ? uv[i * 2] : 0, uv ? uv[i * 2 + 1] : 0);
    }
    g.dispose();
  }
  box(w, h, d, x, y, z, rotY, color) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y + h / 2, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY || 0),
      new THREE.Vector3(w, h, d),
    );
    this.add(UNIT_BOX, m, color);
  }
  cylinder(r, h, x, y, z, color, seg = 16, rTop) {
    const g = new THREE.CylinderGeometry(rTop ?? r, r, h, seg);
    this.add(g, new THREE.Matrix4().makeTranslation(x, y + h / 2, z), color);
    g.dispose();
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere();
    return g;
  }
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

export const col = (hex) => new THREE.Color(hex);
