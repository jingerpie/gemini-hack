// Spatial-understanding bench for the fast path (no server needed; calls Hydrogen directly, 4 at a time).
// Usage: node server/test/space_bench.mjs <label> [--see=imagePath] [--only=1,2,3]
import fs from 'node:fs';
const label = process.argv[2] || 'run';
// --impl=baseline uses the snapshot of patch.mjs + prompts taken before the SPACE work (test/baseline/)
const { orchestrate, buildOps } = await import(process.argv.includes('--impl=baseline') ? './baseline/patch.mjs' : '../patch.mjs');
// --see: render the case's scene (from its camera if it has a view) to PNG and send it to Hydrogen as the screenshot
const SEE = process.argv.includes('--see');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',').map(Number)) : null;

// Room 6 x 5 x 2.8: x in [-3,3], z in [-2.5,2.5] (front = +z, open camera side).
import { obj, furnishedScene as furnished } from './space_scene.mjs';
import { renderScenePng } from './render_scene_png.mjs';

// ---------- geometry helpers for checks ----------
const ext = o => { const a = (o.rotation_y_deg || 0) * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  return { ex: (o.size.x * c + o.size.z * s) / 2, ez: (o.size.x * s + o.size.z * c) / 2 }; };
const fp = o => { const e = ext(o); return { x0: o.position.x - e.ex, x1: o.position.x + e.ex, z0: o.position.z - e.ez, z1: o.position.z + e.ez }; };
const isRug = o => o.size.y < 0.06;
function overlapsAny(o, objs) {
  if (isRug(o)) return [];
  const a = fp(o), hits = [];
  for (const b of objs) {
    if (b.id === o.id || isRug(b) || (b.parent || '') !== (o.parent || '')) continue;
    if (o.parent && b.parent && o.parent === b.parent) { /* same support */ } else if (o.parent || b.parent) continue;
    const B = fp(b);
    if (Math.min(a.x1, B.x1) - Math.max(a.x0, B.x0) > 0.02 && Math.min(a.z1, B.z1) - Math.max(a.z0, B.z0) > 0.02) hits.push(b.id);
  }
  return hits;
}
const inRoom = o => { const f = fp(o); return f.x0 >= -3.01 && f.x1 <= 3.01 && f.z0 >= -2.51 && f.z1 <= 2.51 && o.position.y + o.size.y <= 2.81; };
function apply(scene, ops) {
  const s = structuredClone(scene);
  for (const o of ops) {
    if (o.op === 'add') s.objects.push(structuredClone(o.object));
    else if (o.op === 'update') { const x = s.objects.find(y => y.id === o.id); if (x) Object.assign(x, o.changes); }
    else if (o.op === 'remove') s.objects = s.objects.filter(y => y.id !== o.id);
    else if (o.op === 'add_decal') s.decals.push(structuredClone(o.decal));
    else if (o.op === 'update_decal') { const x = s.decals.find(y => y.id === o.id); if (x) Object.assign(x, o.changes); }
  }
  return s;
}
const added = (ops, s) => ops.filter(o => o.op === 'add').map(o => s.objects.find(x => x.id === o.id)).filter(Boolean);
const addedDecals = ops => ops.filter(o => o.op === 'add_decal').map(o => o.decal);
const get = (s, id) => s.objects.find(o => o.id === id);
const clean = (o, s) => { const h = overlapsAny(o, s.objects); return h.length ? `${o.id} overlaps ${h}` : !inRoom(o) ? `${o.id} outside room` : null; };
const near = (a, b, d) => Math.hypot(a.x - b.x, a.z - b.z) <= d;
const CORNERS = { back_left: { x: -2.6, z: -2.1 }, back_right: { x: 2.6, z: -2.1 }, front_left: { x: -2.6, z: 2.1 }, front_right: { x: 2.6, z: 2.1 } };
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const fail = m => m; // a string = failure reason; null = pass
const one = (arr, what) => arr.length >= 1 ? null : `no ${what} added`;

// ---------- cases ----------
const H = (u, applied) => [{ u, applied }];
const CASES = [
  { u: 'put a plant in the empty corner', check: (ops, s) => { const n = added(ops, s); if (!n.length) return one(n, 'object');
    const o = n[0]; const free = ['back_right', 'front_right'].some(k => near(o.position, CORNERS[k], 0.7)); return !free ? `plant at (${o.position.x},${o.position.z}) not in an empty corner` : clean(o, s); } },
  { u: 'put a vase on the table', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    if (o.parent !== 'table1') return `parent=${o.parent || '""'}`; if (Math.abs(o.position.y - 0.45) > 0.03) return `y=${o.position.y}`;
    const f = fp(o); return (f.x0 >= -0.56 && f.x1 <= 0.56 && f.z0 >= -1.11 && f.z1 <= -0.49) ? null : 'footprint off table top'; } },
  { u: 'hang a painting above the sofa', check: ops => { const d = addedDecals(ops)[0]; if (!d) return 'no decal';
    if (d.surface !== 'wall_back') return `surface ${d.surface}`; if (Math.abs(d.x) > 0.3) return `x=${d.x}`; return d.y - d.height / 2 >= 0.9 ? null : `bottom ${(d.y - d.height / 2).toFixed(2)} below sofa top+0.05`; } },
  { u: 'put a rug under the coffee table', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    if (o.size.y > 0.06) return `rug height ${o.size.y}`; if (o.parent) return `parent ${o.parent}`; const f = fp(o);
    return (f.x0 <= -0.55 && f.x1 >= 0.55 && f.z0 <= -1.1 && f.z1 >= -0.5) ? null : 'rug does not cover the table footprint'; } },
  { u: 'add a lamp next to the armchair', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    const a = fp(get(s, 'armchair1')), f = fp(o); const gap = Math.max(a.x0 - f.x1, f.x0 - a.x1, a.z0 - f.z1, f.z0 - a.z1);
    return gap > 0.6 ? `gap to armchair ${gap.toFixed(2)} m` : clean(o, s); } },
  { u: 'move the armchair to the other corner', check: (ops, s) => { const o = get(s, 'armchair1');
    const k = Object.keys(CORNERS).find(c => near(o.position, CORNERS[c], 0.7)); if (!k || k === 'back_left') return `armchair at (${o.position.x},${o.position.z}) corner=${k}`;
    return clean(o, s); } },
  { u: 'put the lamp behind the sofa', check: (ops, s) => { const o = get(s, 'lamp1'); return clean(o, s); } },
  { u: 'put a side table between the sofa and the armchair', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    if (!(o.position.x > -2.075 && o.position.x < -1.05)) return `x=${o.position.x} not between`; if (o.position.z < -2.5 || o.position.z > -1.3) return `z=${o.position.z}`; return clean(o, s); } },
  { u: 'turn the armchair to face the sofa', check: (ops, s) => { const o = get(s, 'armchair1'); const r = ((o.rotation_y_deg % 360) + 360) % 360;
    return r >= 55 && r <= 125 ? clean(o, s) : `rotation ${o.rotation_y_deg}`; } },
  { u: 'swap the lamp and the plant', check: (ops, s) => { const l = get(s, 'lamp1'), p = get(s, 'plant1');
    return near(l.position, { x: -2.55, z: 2.05 }, 0.45) && near(p.position, { x: 2.55, z: 1.3 }, 0.45) ? null : `lamp (${l.position.x},${l.position.z}) plant (${p.position.x},${p.position.z})`; } },
  { u: 'move it a bit to the left', history: H('make the lamp brass', 'update lamp1 {"color":"#b08d57"}'), check: (ops, s) => { const o = get(s, 'lamp1');
    const dx = o.position.x - 2.55, dz = o.position.z - 1.3; return dx <= -0.1 && dx >= -0.7 && Math.abs(dz) <= 0.15 ? null : `lamp moved dx=${dx.toFixed(2)} dz=${dz.toFixed(2)}`; } },
  { u: 'put another one on the other side', history: H('put a small side table to the right of the sofa', 'add sidetable1 custom "round walnut side table" @(1.35,0,-2.1)'),
    extra: [obj('sidetable1', 'round walnut side table', { x: 0.45, y: 0.55, z: 0.45 }, { x: 1.35, y: 0, z: -2.1 })],
    check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object'; return Math.abs(o.position.x + 1.35) <= 0.35 && Math.abs(o.position.z + 2.1) <= 0.4 ? clean(o, s) : `at (${o.position.x},${o.position.z})`; } },
  { u: 'make this red', view: { position: { x: 0, y: 1.6, z: 4 }, target: { x: 0, y: 1, z: -1 }, pointed: 'shelf1', pointedAt: { x: 2.6, y: 1.2, z: 0.1 } },
    check: ops => { const u = ops.find(o => o.op === 'update' && o.id === 'shelf1' && o.changes.color); if (!u) return `no color change on shelf1 (${ops.map(o => o.op + ' ' + o.id)})`;
      const [r, g, b] = hexRgb(u.changes.color); return r > g + 40 && r > b + 40 ? null : `color ${u.changes.color}`; } },
  { u: 'put a plant here', view: { position: { x: 0, y: 1.6, z: 4 }, target: { x: 0, y: 1, z: -1 }, pointed: 'floor', pointedAt: { x: 1.8, y: 0, z: -1.6 } },
    check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object'; return near(o.position, { x: 1.8, z: -1.6 }, 0.5) ? clean(o, s) : `at (${o.position.x},${o.position.z}) not at pointed spot`; } },
  { u: 'a poster on that wall', view: { position: { x: 0, y: 1.6, z: 4 }, target: { x: 0, y: 1, z: -1 }, pointed: 'wall_left', pointedAt: { x: -3, y: 1.5, z: 0.5 } },
    check: ops => { const d = addedDecals(ops)[0]; return !d ? 'no decal' : d.surface === 'wall_left' ? null : `surface ${d.surface}`; } },
  { u: 'put a poster on the wall on my right', view: { position: { x: 1.5, y: 1.6, z: 0.5 }, target: { x: -3, y: 1.2, z: 0 } },
    check: ops => { const d = addedDecals(ops)[0]; return !d ? 'no decal' : d.surface === 'wall_back' ? null : `surface ${d.surface} (camera faces the left wall, so right = back wall)`; } },
  { u: 'put a plant in front of the shelf', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    return o.position.x >= 1.4 && o.position.x <= 2.6 && Math.abs(o.position.z) <= 0.7 ? clean(o, s) : `at (${o.position.x},${o.position.z})`; } },
  { u: 'hang a pendant lamp from the ceiling above the coffee table', check: (ops, s) => { const o = added(ops, s)[0]; if (!o) return 'no object';
    const top = o.position.y + o.size.y; return Math.abs(top - 2.8) <= 0.1 && near(o.position, { x: 0, z: -0.8 }, 0.3) ? null : `top ${top.toFixed(2)} at (${o.position.x},${o.position.z})`; } },
  { u: 'put a clock on the wall above the shelf', check: ops => { const d = addedDecals(ops)[0]; if (!d) return 'no decal';
    if (d.surface !== 'wall_right') return `surface ${d.surface}`; if (Math.abs(d.x) > 0.35) return `x=${d.x}`; return d.y - d.height / 2 >= 1.85 ? null : `bottom ${(d.y - d.height / 2).toFixed(2)} below shelf top`; } },
  { u: 'move the coffee table a bit closer to the sofa', check: (ops, s) => { const o = get(s, 'table1'); const dz = o.position.z + 0.8;
    return dz <= -0.08 && dz >= -0.4 && Math.abs(o.position.x) <= 0.05 ? clean(o, s) : `dz=${dz.toFixed(2)} x=${o.position.x}`; } },
];

// ---------- run ----------
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const results = []; let i = 0; let stop = false;
const idx = CASES.map((c, k) => k + 1).filter(k => !ONLY || ONLY.has(k));
async function worker() {
  while (idx.length && !stop) {
    const k = idx.shift(), c = CASES[k - 1];
    const scene = furnished(); if (c.extra) scene.objects.push(...c.extra);
    const req = { scene, history: c.history || [], utterance: c.u, ...(c.view && { view: c.view }), ...(SEE && { image: `data:image/png;base64,${renderScenePng(scene, c.view ? { cam: c.view.position, target: c.view.target } : {}).toString('base64')}` }) };
    const t0 = Date.now();
    try {
      const calls = await orchestrate(req, { see: SEE });
      const ms = Date.now() - t0;
      const out = buildOps(calls, scene);
      if (calls.some(x => x.name === 'ask_designer')) { results.push({ k, u: c.u, ms, pass: false, why: 'routed to designer', ops: [] }); continue; }
      const after = apply(scene, out.ops);
      let why; try { why = c.check(out.ops, after); } catch (e) { why = 'check error ' + e.message; }
      results.push({ k, u: c.u, ms, pass: !why, why, say: out.say, dropped: out.dropped,
        ops: out.ops.map(o => o.op === 'add' ? `add ${o.id} @(${o.object.position.x},${o.object.position.y},${o.object.position.z}) ${o.object.size.x}x${o.object.size.y}x${o.object.size.z} r${o.object.rotation_y_deg}${o.object.parent ? ' on ' + o.object.parent : ''}`
          : o.op === 'add_decal' ? `add_decal ${o.id} ${o.decal.surface} x${o.decal.x} y${o.decal.y} ${o.decal.width}x${o.decal.height}` : `${o.op} ${o.id} ${JSON.stringify(o.changes || {}).slice(0, 120)}`) });
    } catch (e) {
      const msg = String(e.message || e); results.push({ k, u: c.u, ms: Date.now() - t0, pass: false, why: 'ERROR ' + msg.slice(0, 120), ops: [] });
      if (/^402/.test(msg)) { stop = true; console.log('!!! 402 credits depleted, stopping'); }
    }
  }
}
const CONC = +((process.argv.find(a => a.startsWith('--conc=')) || '--conc=2').slice(7));
await Promise.all(Array.from({ length: CONC }, worker));
results.sort((a, b) => a.k - b.k);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${String(r.k).padStart(2)} ${String(r.ms).padStart(5)}ms "${r.u}"${r.why ? '  <- ' + r.why : ''}`);
  for (const o of r.ops) console.log(`        ${o}`);
  if (r.say) console.log(`        say: ${r.say}${r.dropped?.length ? ' | dropped: ' + r.dropped.join('; ') : ''}`);
}
const ms = results.filter(r => !String(r.why).startsWith('ERROR')).map(r => r.ms);
console.log(`\n${label}: ${results.filter(r => r.pass).length}/${results.length} pass, median ${med(ms)} ms, worst ${Math.max(...ms)} ms`);
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./out/space_bench_${label}.json`, import.meta.url), JSON.stringify(results, null, 2));
