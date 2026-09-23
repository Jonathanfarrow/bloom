import { HILL } from '../data/town.js';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function groundHeight(x, z) {
  const dx = x - HILL.x, dz = z - HILL.z;
  return HILL.h * Math.exp(-(dx * dx + dz * dz) / (2 * HILL.sigma * HILL.sigma));
}

// Polyline helper: cumulative lengths, point + direction at distance t.
export class Path {
  constructor(pts) {
    this.pts = pts;
    this.cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
      this.cum.push(this.cum[i - 1] + Math.hypot(x1 - x0, z1 - z0));
    }
    this.length = this.cum[this.cum.length - 1];
  }
  at(t) {
    t = Math.max(0, Math.min(this.length, t));
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < t) i++;
    const [x0, z0] = this.pts[i - 1], [x1, z1] = this.pts[i];
    const seg = this.cum[i] - this.cum[i - 1] || 1;
    const f = (t - this.cum[i - 1]) / seg;
    const dx = (x1 - x0) / seg, dz = (z1 - z0) / seg;
    // left normal (-dz, dx)
    return { x: x0 + (x1 - x0) * f, z: z0 + (z1 - z0) * f, dx, dz, nx: -dz, nz: dx };
  }
  closestT(x, z) {
    let best = Infinity, bestT = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const [x0, z0] = this.pts[i - 1], [x1, z1] = this.pts[i];
      const vx = x1 - x0, vz = z1 - z0;
      const l2 = vx * vx + vz * vz;
      const f = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / l2));
      const px = x0 + vx * f, pz = z0 + vz * f;
      const d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bestT = this.cum[i - 1] + f * Math.sqrt(l2); }
    }
    return bestT;
  }
}

export function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function polyBounds(pts) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
}

export function polyArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
}
