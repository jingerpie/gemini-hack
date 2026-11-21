// Small routing regression check (6 calls, 2 at a time): single edits stay on the fast path, whole-room goes to the designer.
import { orchestrate } from '../patch.mjs';
import { defaultScene } from './patch_test.mjs';
const CASES = [['single', 'paint the walls black'], ['single', 'add a throne chair'], 
  ['whole', 'make this a cozy reading room'], ['whole', 'this feels empty, fix it']];
const q = [...CASES]; const out = [];
async function w() { while (q.length) { const [k, u] = q.shift(); const t0 = Date.now();
  try { const calls = await orchestrate({ scene: defaultScene(), history: [], utterance: u }); out.push({ k, u, ms: Date.now() - t0, d: calls.some(c => c.name === 'ask_designer'), calls: calls.map(c => c.name).join(',') }); }
  catch (e) { out.push({ k, u, ms: Date.now() - t0, err: String(e.message).slice(0, 80) }); } } }
await Promise.all([w(), w()]);
for (const r of out) console.log(`[${r.k}] ${r.err ? 'ERR ' + r.err : r.d ? 'DESIGNER' : 'fast    '} ${r.ms}ms "${r.u}" ${r.calls || ''}`);
const ok = out.filter(r => !r.err && (r.k === 'whole') === r.d).length; console.log(`routing ${ok}/${out.length} correct`);
