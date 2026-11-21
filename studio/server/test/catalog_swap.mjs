// Two quick checks: latency of a non-furniture edit with the catalog block, and a catalog swap. Usage: node server/test/catalog_swap.mjs [baseUrl]
import { defaultScene } from './patch_test.mjs';
const BASE = process.argv[2] || 'http://localhost:8787';
const scene = defaultScene();
scene.objects[0] = { ...scene.objects[0], name: 'Interlude', size: { x: 2.1, y: 0.78, z: 0.89 }, position: { x: 0, y: 0, z: -2.01 },
  product: { title: 'Interlude', price: '$225', store: 'x', url: '', image_url: '', catalogId: 'sofa/04-interlude' } };
for (const u of ['paint the walls black', 'swap the sofa for a different one']) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/patch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene, history: [], utterance: u }) });
  const js = await r.json();
  console.log(`"${u}" ${Date.now() - t0} ms | say: ${js.say}`);
  for (const o of js.ops) { const b = o.changes || o.object || {}; console.log(`  ${o.op} ${o.id} ${b.product?.catalogId || ''} ${b.position ? JSON.stringify(b.position) : ''} ${b.rotation_y_deg ?? ''}`); }
  for (const j of js.jobs) { const op = js.ops.find(o => o.id === j.objectId); const b = op?.changes || op?.object || {};
    console.log(`  job ${j.objectId} catalogId=${j.catalogId} descMatches=${j.description === b.description} sizeMatches=${JSON.stringify(j.size) === JSON.stringify(b.size)}`); }
}
