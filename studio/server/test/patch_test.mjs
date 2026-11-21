// Sequential /api/patch test over a default living room. Usage: node server/test/patch_test.mjs [baseUrl]
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:8787';
export const defaultScene = () => ({
  room: { width: 6, depth: 5, height: 2.8 },
  surfaces: {
    wall_back: { id: 'wall_back', color: '#e8e4dc' }, wall_left: { id: 'wall_left', color: '#e8e4dc' },
    wall_right: { id: 'wall_right', color: '#e8e4dc' }, floor: { id: 'floor', color: '#a0703c', material: { roughness: 0.7 } },
    ceiling: { id: 'ceiling', color: '#f5f5f5' },
  },
  objects: [
    { id: 'sofa1', name: 'grey sofa', shape: 'custom', size: { x: 2.1, y: 0.85, z: 0.95 }, position: { x: 0, y: 0, z: -1.95 }, rotation_y_deg: 0, color: '#7a7a7a', parent: '', description: 'A modern three-seat sofa in grey fabric with low square arms and thin black metal legs.', status: 'ready' },
    { id: 'table1', name: 'coffee table', shape: 'custom', size: { x: 1.1, y: 0.45, z: 0.6 }, position: { x: 0, y: 0, z: -0.6 }, rotation_y_deg: 0, color: '#5a3a22', parent: '', description: 'A rectangular walnut coffee table with tapered legs.', status: 'ready' },
  ],
  decals: [],
});

export function applyOps(scene, ops) {
  for (const o of ops) {
    if (o.op === 'add') scene.objects.push(structuredClone(o.object));
    else if (o.op === 'update') { const x = scene.objects.find(y => y.id === o.id); if (x) Object.assign(x, o.changes); }
    else if (o.op === 'remove') scene.objects = scene.objects.filter(y => y.id !== o.id);
    else if (o.op === 'surface') Object.assign(scene.surfaces[o.id], o.changes);
    else if (o.op === 'add_decal') scene.decals.push(structuredClone(o.decal));
    else if (o.op === 'update_decal') { const x = scene.decals.find(y => y.id === o.id); if (x) Object.assign(x, o.changes); }
    else if (o.op === 'remove_decal') scene.decals = scene.decals.filter(y => y.id !== o.id);
  }
}
const summarize = ops => ops.map(o => o.op === 'surface' ? `surface ${o.id} ${JSON.stringify(o.changes)}` :
  o.op === 'add' ? `add ${o.id} (${o.object.shape} ${o.object.name})` : o.op === 'add_decal' ? `add_decal ${o.id} on ${o.decal.surface}` : `${o.op} ${o.id}`).join('; ') || 'nothing';

const UTTERANCES = process.argv.slice(3).length ? process.argv.slice(3) : [
  'paint the walls black',
  'put a BMW logo on that wall',
  'I want a chair over there by the left wall, but make it look like a throne',
  'make the floor shiny',
  'hmm let me think about what else',
];

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const scene = defaultScene(); const history = []; const results = [];
  for (const u of UTTERANCES) {
    const t0 = Date.now();
    const r = await fetch(`${BASE}/api/patch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene, history, utterance: u }) });
    const js = await r.json();
    const wall = Date.now() - t0;
    if (!r.ok) { console.log(`"${u}" -> HTTP ${r.status} ${JSON.stringify(js)}`); continue; }
    applyOps(scene, js.ops);
    history.push({ u, applied: summarize(js.ops) });
    results.push({ u, wall, ...js });
    console.log(`\n"${u}"  [${wall} ms wall, ${js.ms} ms model]  say: ${js.say}`);
    for (const o of js.ops) console.log('  op', JSON.stringify(o));
    for (const j of js.jobs) console.log('  job', JSON.stringify(j));
    if (js.dropped) console.log('  dropped', js.dropped);
  }
  fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  fs.writeFileSync(new URL('./out/patch_results.json', import.meta.url), JSON.stringify({ results, scene }, null, 2));
}
