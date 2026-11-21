// End-to-end /api/patch designer-path test against the running server. Usage: node server/test/designer_e2e.mjs [imagePath]
import fs from 'node:fs';
import { defaultScene } from './patch_test.mjs';
const BASE = 'http://localhost:8787';
const img = process.argv[2] && fs.existsSync(process.argv[2]) ? `data:image/${process.argv[2].endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(process.argv[2]).toString('base64')}` : undefined;

async function call(label, utterance, { q = '', image } = {}) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/patch${q}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: defaultScene(), history: [], utterance, ...(image && { image }) }) });
  const js = await r.json(); const wall = Date.now() - t0;
  const short = (js.ops || []).map(o => o.op === 'add' ? `add ${o.id} "${o.object.name}" @(${o.object.position.x},${o.object.position.z}) ${o.object.size.x}x${o.object.size.z} rot${o.object.rotation_y_deg}${o.object.parent ? ' on ' + o.object.parent : ''}`
    : o.op === 'surface' ? `surface ${o.id} ${o.changes.color || ''}${o.changes.material ? ' r' + o.changes.material.roughness : ''}`
    : o.op === 'add_decal' ? `decal ${o.id} ${o.decal.surface} "${o.decal.prompt.slice(0, 50)}..."` : `${o.op} ${o.id} ${Object.keys(o.changes || {}).join(',')}`);
  return `\n[${label}] HTTP ${r.status} wall ${wall} ms, ms ${js.ms}, model ${js.model}, ${js.ops?.length} ops, ${js.jobs?.length} jobs${js.dropped ? ', dropped ' + JSON.stringify(js.dropped) : ''}${js.error ? ' ERROR ' + js.error : ''}\n  brief: ${js.brief || '-'}\n  say: ${js.say}\n  ` + short.join('\n  ');
}
console.log(await call('fast', 'paint the walls black'));
const res = await Promise.all([
  call('designer default', 'make this a cozy reading room'),
  call('designer + image', 'this feels empty, fix it', { image: img }),
  call('override carbon', 'design this as a gaming den', { q: '?designer=gemini-4-carbon' }),
  call('override bogus -> fallback', 'make it feel more luxurious', { q: '?designer=gemini-4-doesnotexist' }),
]);
console.log(res.join('\n'));
