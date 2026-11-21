// /api/decal (BMW logo from the patch test) then /api/verify on the generated image and on a synthetic PNG.
import fs from 'node:fs';
import zlib from 'node:zlib';
const BASE = process.env.BASE || 'http://localhost:8787';
const OUT = new URL('./out/', import.meta.url); fs.mkdirSync(OUT, { recursive: true });
const post = async (p, body) => { const t0 = Date.now(); const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, js: await r.json(), wall: Date.now() - t0 }; };

function png() { // 64x64 red square on white
  const w = 64, h = 64, rows = [];
  for (let y = 0; y < h; y++) { rows.push(0); for (let x = 0; x < w; x++) rows.push(...(x >= 16 && x < 48 && y >= 16 && y < 48 ? [255, 0, 0] : [255, 255, 255])); }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const ch = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ihdr), ch('IDAT', zlib.deflateSync(Buffer.from(rows))), ch('IEND', Buffer.alloc(0))]);
}

const which = process.argv[2] || 'all';
if (which === 'all' || which === 'verify') {
  const img = 'data:image/png;base64,' + png().toString('base64');
  const v = await post('/api/verify', { image: img, claims: [{ key: 'red_square', text: 'a red square' }, { key: 'blue_circle', text: 'a blue circle' }] });
  console.log(`verify synthetic: HTTP ${v.status} wall ${v.wall} ms`, JSON.stringify(v.js));
}
if (which === 'all' || which === 'decal') {
  const prompt = process.argv[3] || 'A flat, front-on vector graphic of the BMW roundel logo with its blue and white quarters, black outer ring, silver metallic border, and white BMW lettering, centered on a plain solid black background, crisp edges, no perspective, no mockup, no wall, no shadows.';
  const d = await post('/api/decal', { decalId: 'bmw_logo1', prompt, width: +(process.argv[4] || 1), height: +(process.argv[5] || 1) });
  console.log(`decal: HTTP ${d.status} wall ${d.wall} ms`, d.status === 200 ? `model=${d.js.model} ms=${d.js.ms} ar=${d.js.aspectRatio} ${d.js.dataUrl.slice(0, 30)}... ${Math.round(d.js.dataUrl.length / 1024)}KB` : JSON.stringify(d.js));
  if (d.status === 200) {
    const [, mime, b64] = d.js.dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    fs.writeFileSync(new URL(`decal_${Date.now()}.${mime.split('/')[1]}`, OUT), Buffer.from(b64, 'base64'));
    const v = await post('/api/verify', { image: d.js.dataUrl, claims: [{ key: 'logo', text: 'a BMW logo' }, { key: 'sofa', text: 'a sofa' }] });
    console.log(`verify decal image: HTTP ${v.status} wall ${v.wall} ms`, JSON.stringify(v.js));
  }
}
