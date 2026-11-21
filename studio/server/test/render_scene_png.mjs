// Tiny flat-shaded software render of a Scene to PNG (walls, floor, object boxes, decals), so the fast-path image
// test sends a picture that matches the bench scene. Usage: import { renderScenePng } ... or run to write out/bench_room.png
import zlib from 'node:zlib';
import fs from 'node:fs';

const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hexRgb = h => { const s = String(h || '#888888').replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) || 128); };

export function renderScenePng(scene, { W = 960, Hh = 600, cam = { x: 0, y: 1.7, z: 5.2 }, target = { x: 0, y: 1.0, z: -1 }, fov = 62 } = {}) {
  const img = Buffer.alloc(W * Hh * 3, 30);
  const f = { x: target.x - cam.x, y: target.y - cam.y, z: target.z - cam.z }; const fl = Math.hypot(f.x, f.y, f.z); f.x /= fl; f.y /= fl; f.z /= fl;
  let r = { x: -f.z, y: 0, z: f.x }; const rl = Math.hypot(r.x, r.z); r = { x: r.x / rl, y: 0, z: r.z / rl };
  const u = { x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x };
  const foc = (Hh / 2) / Math.tan(fov * Math.PI / 360);
  const proj = p => { const d = { x: p.x - cam.x, y: p.y - cam.y, z: p.z - cam.z }; const zc = d.x * f.x + d.y * f.y + d.z * f.z;
    return { x: W / 2 + foc * (d.x * r.x + d.y * r.y + d.z * r.z) / zc, y: Hh / 2 - foc * (d.x * u.x + d.y * u.y + d.z * u.z) / zc, depth: zc }; };
  const faces = [];
  const quad = (pts, color, shade = 1) => { const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length, z: a.z + p.z / pts.length }), { x: 0, y: 0, z: 0 });
    faces.push({ pts: pts.map(proj), color: hexRgb(color).map(v => Math.min(255, v * shade)), d: Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z) }); };
  const { width: RW, depth: RD, height: RH } = scene.room; const hx = RW / 2, hz = RD / 2;
  const S = scene.surfaces || {};
  quad([{ x: -hx, y: 0, z: -hz }, { x: hx, y: 0, z: -hz }, { x: hx, y: 0, z: hz }, { x: -hx, y: 0, z: hz }], S.floor?.color || '#a0703c', 0.9);
  quad([{ x: -hx, y: 0, z: -hz }, { x: hx, y: 0, z: -hz }, { x: hx, y: RH, z: -hz }, { x: -hx, y: RH, z: -hz }], S.wall_back?.color || '#e8e4dc', 1);
  quad([{ x: -hx, y: 0, z: -hz }, { x: -hx, y: 0, z: hz }, { x: -hx, y: RH, z: hz }, { x: -hx, y: RH, z: -hz }], S.wall_left?.color || '#e8e4dc', 0.85);
  quad([{ x: hx, y: 0, z: -hz }, { x: hx, y: 0, z: hz }, { x: hx, y: RH, z: hz }, { x: hx, y: RH, z: -hz }], S.wall_right?.color || '#e8e4dc', 0.8);
  const back = [...faces]; faces.length = 0; // room shell is drawn first, always behind
  for (const d of scene.decals || []) {
    const x0 = d.x - d.width / 2, x1 = d.x + d.width / 2, y0 = d.y - d.height / 2, y1 = d.y + d.height / 2, e = 0.01;
    const P = d.surface === 'wall_back' ? (a, y) => ({ x: a, y, z: -hz + e }) : d.surface === 'wall_left' ? (a, y) => ({ x: -hx + e, y, z: -a }) : (a, y) => ({ x: hx - e, y, z: a });
    quad([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], '#c04040', 1);
  }
  const decalFaces = [...faces]; faces.length = 0;
  for (const o of scene.objects || []) {
    const a = (o.rotation_y_deg || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), { x: sx, y: sy, z: sz } = o.size, p = o.position;
    const V = (lx, ly, lz) => ({ x: p.x + lx * c + lz * s, y: p.y + ly, z: p.z - lx * s + lz * c });
    const v = [V(-sx / 2, 0, -sz / 2), V(sx / 2, 0, -sz / 2), V(sx / 2, 0, sz / 2), V(-sx / 2, 0, sz / 2), V(-sx / 2, sy, -sz / 2), V(sx / 2, sy, -sz / 2), V(sx / 2, sy, sz / 2), V(-sx / 2, sy, sz / 2)];
    for (const [ids, sh] of [[[4, 5, 6, 7], 1.15], [[3, 2, 6, 7], 0.95], [[0, 1, 5, 4], 0.7], [[0, 3, 7, 4], 0.8], [[1, 2, 6, 5], 0.8]]) quad(ids.map(i => v[i]), o.color, sh);
  }
  faces.sort((A, B) => B.d - A.d);
  for (const fc of [...back, ...decalFaces, ...faces]) {
    const P = fc.pts; if (P.some(q => q.depth <= 0.05)) continue;
    const minX = Math.max(0, Math.floor(Math.min(...P.map(q => q.x)))), maxX = Math.min(W - 1, Math.ceil(Math.max(...P.map(q => q.x))));
    const minY = Math.max(0, Math.floor(Math.min(...P.map(q => q.y)))), maxY = Math.min(Hh - 1, Math.ceil(Math.max(...P.map(q => q.y))));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      let pos = false, neg = false;
      for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; const cr = (B.x - A.x) * (y - A.y) - (B.y - A.y) * (x - A.x); if (cr > 0) pos = true; else if (cr < 0) neg = true; }
      if (pos && neg) continue;
      const k = (y * W + x) * 3; img[k] = fc.color[0]; img[k + 1] = fc.color[1]; img[k + 2] = fc.color[2];
    }
  }
  return png(W, Hh, img);
}

if (process.argv[1]?.endsWith('render_scene_png.mjs')) {
  const { furnishedScene } = await import('./space_scene.mjs');
  fs.writeFileSync(new URL('./out/bench_room.png', import.meta.url), renderScenePng(furnishedScene()));
  console.log('wrote out/bench_room.png');
}
