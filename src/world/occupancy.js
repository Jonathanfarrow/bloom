// Coarse raster that records where roads, rivers, parks and buildings are,
// so procedural buildings and trees don't overlap anything.
export class Occupancy {
  constructor(half = 760, cell = 2) {
    this.half = half; this.cell = cell;
    this.n = Math.ceil((half * 2) / cell);
    this.grid = new Uint8Array(this.n * this.n);
  }
  idx(x, z) {
    const i = Math.floor((x + this.half) / this.cell), j = Math.floor((z + this.half) / this.cell);
    if (i < 0 || j < 0 || i >= this.n || j >= this.n) return -1;
    return j * this.n + i;
  }
  get(x, z) { const k = this.idx(x, z); return k < 0 ? 255 : this.grid[k]; }
  set(x, z, v) { const k = this.idx(x, z); if (k >= 0) this.grid[k] = Math.max(this.grid[k], v); }

  markSegment(x0, z0, x1, z1, halfWidth, v) {
    const c = this.cell;
    const minX = Math.min(x0, x1) - halfWidth, maxX = Math.max(x0, x1) + halfWidth;
    const minZ = Math.min(z0, z1) - halfWidth, maxZ = Math.max(z0, z1) + halfWidth;
    const vx = x1 - x0, vz = z1 - z0, l2 = vx * vx + vz * vz || 1;
    for (let z = minZ; z <= maxZ; z += c) {
      for (let x = minX; x <= maxX; x += c) {
        const f = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / l2));
        const d = Math.hypot(x - (x0 + vx * f), z - (z0 + vz * f));
        if (d <= halfWidth) this.set(x, z, v);
      }
    }
  }
  markPolyline(pts, halfWidth, v) {
    for (let i = 1; i < pts.length; i++) this.markSegment(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], halfWidth, v);
  }
  markRect(cx, cz, w, d, angle, v, pad = 0) {
    this.forRect(cx, cz, w + pad * 2, d + pad * 2, angle, (x, z) => this.set(x, z, v));
  }
  markPoly(pts, v, inside) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let z = z0; z <= z1; z += this.cell) for (let x = x0; x <= x1; x += this.cell) if (inside(x, z)) this.set(x, z, v);
  }
  forRect(cx, cz, w, d, angle, fn) {
    const c = Math.cos(angle), s = Math.sin(angle), step = this.cell * 0.7;
    for (let a = -w / 2; a <= w / 2 + 1e-6; a += step) {
      for (let b = -d / 2; b <= d / 2 + 1e-6; b += step) {
        if (fn(cx + a * c - b * s, cz + a * s + b * c) === false) return false;
      }
    }
    return true;
  }
  rectFree(cx, cz, w, d, angle) {
    return this.forRect(cx, cz, w, d, angle, (x, z) => (this.get(x, z) ? false : true));
  }
}
