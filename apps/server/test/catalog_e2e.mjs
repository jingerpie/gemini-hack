// Catalog-first check against a running server. Usage: node apps/server/test/catalog_e2e.mjs [baseUrl]
import { applyOps } from './patch_test.mjs';
const BASE = process.argv[2] || 'http://localhost:8787';
const scene = { room: { width: 6, depth: 5, height: 2.8 }, surfaces: {
  wall_back: { id: 'wall_back', color: '#e8e4dc' }, wall_left: { id: 'wall_left', color: '#e8e4dc' }, wall_right: { id: 'wall_right', color: '#e8e4dc' },
  floor: { id: 'floor', color: '#a0703c' }, ceiling: { id: 'ceiling', color: '#f5f5f5' } }, objects: [], decals: [] };
const history = [];
const U = process.argv.slice(3).length ? process.argv.slice(3) : ['add a sofa', 'add a desk and an office chair', 'add a Christmas tree', 'add a floor lamp next to the sofa', 'swap the sofa for a cheaper one', 'design this as a cozy reading room'];
for (const u of U) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/patch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene, history, utterance: u }) });
  const js = await r.json(); const wall = Date.now() - t0;
  if (!r.ok) { console.log(`"${u}" HTTP ${r.status} ${js.error}`); continue; }
  console.log(`\n"${u}"  ${wall} ms wall, ${js.ms} ms server, model ${js.model}  say: ${js.say}`);
  for (const o of js.ops) {
    const ob = o.object || o.changes || {};
    if (o.op === 'add' || o.op === 'update') console.log(`  ${o.op} ${o.id} "${ob.name || ''}" ${ob.product?.catalogId ? 'CATALOG ' + ob.product.catalogId + ' ' + ob.product.price : (o.op === 'add' ? 'GENERATED' : '')} ${ob.size ? `${ob.size.x}x${ob.size.y}x${ob.size.z}` : ''} ${ob.position ? `@(${ob.position.x},${ob.position.z})` : ''} ${ob.rotation_y_deg !== undefined ? 'r' + ob.rotation_y_deg : ''}`);
    else console.log(`  ${o.op} ${o.id}`);
  }
  console.log(`  jobs: ${js.jobs.map(j => j.kind === 'asset' ? `${j.objectId}:${j.catalogId ? 'catalog' : 'generate'}` : `decal ${j.decalId}`).join(', ')}${js.dropped ? ' | dropped ' + js.dropped.join('; ') : ''}`);
  applyOps(scene, js.ops);
  history.push({ u, applied: js.ops.map(o => `${o.op} ${o.id}`).join('; '), ids: js.ops.map(o => o.id) });
}
const cat = scene.objects.find(o => o.product?.catalogId);
if (cat) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/asset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objectId: cat.id, name: cat.name, description: cat.description, size: cat.size, catalogId: cat.product.catalogId }) });
  const txt = await r.text(); const ev = JSON.parse(txt.trim().replace(/^data:\s*/, ''));
  console.log(`\n/api/asset catalogId ${cat.product.catalogId}: ${Date.now() - t0} ms wall, type ${ev.type}, via ${ev.via}, ${ev.code?.length} chars`);
}
