// POST /api/render: 400 without an image, then one real render of a canvas screenshot.
// node apps/server/test/render_test.mjs <screenshot.jpg|png> [scene.json] [style]
//   (screenshot: e.g. engine.screenshot() saved from /src/scene/dev.html; OUT env = output dir, default ./out)
import fs from 'node:fs';
import path from 'node:path';
const BASE = process.env.BASE || 'http://localhost:8787';
const OUT = process.env.OUT || new URL('./out/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const post = async body => { const t0 = Date.now(); const r = await fetch(BASE + '/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, js: await r.json(), wall: Date.now() - t0 }; };

const bad = await post({ scene: {} });
console.log('no image ->', bad.status, bad.js.error, bad.status === 400 ? 'OK' : 'FAIL');

const [img, sceneFile, style] = process.argv.slice(2);
if (!img) { console.log('pass a screenshot path to run a real render'); process.exit(bad.status === 400 ? 0 : 1); }
const mime = /\.png$/i.test(img) ? 'image/png' : 'image/jpeg';
const body = { image: `data:${mime};base64,${fs.readFileSync(img).toString('base64')}` };
if (sceneFile) body.scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
if (style) body.style = style;
const r = await post(body);
if (r.status !== 200) { console.log('render FAIL', r.status, r.js.error, `${r.wall}ms`); process.exit(1); }
const m = r.js.dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
const file = path.join(OUT, `render_${path.basename(img).replace(/\.\w+$/, '')}.${m[1].replace('jpeg', 'jpg')}`);
fs.writeFileSync(file, Buffer.from(m[2], 'base64'));
console.log(`render OK ${r.status} model=${r.js.model} ms=${r.js.ms} wall=${r.wall}ms ${Math.round(r.js.dataUrl.length / 1024)}KB -> ${file}`);
