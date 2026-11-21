// Streams /api/asset and prints events. Usage: node apps/server/test/asset_test.mjs [race|agent|direct] [tag] [edit]
import fs from 'node:fs';
const mode = process.argv[2] || 'race';
const tag = process.argv[3] || mode;
const BASE = process.env.BASE || 'http://localhost:8787';
const job = {
  objectId: 'throne1', name: 'royal throne',
  description: 'An ornate royal throne chair in dark carved walnut wood and deep crimson velvet upholstery. It features a tall, arched backrest crowned with intricate gilded finials, tufted velvet seat and back cushions, wide scrolled armrests with carved lion-head accents, and sturdy turned legs. Rich, regal finish with subtle satin sheen on the woodwork and soft matte velvet.',
  size: { x: 0.9, y: 1.6, z: 0.8 },
};
if (process.argv[4] === 'edit') {
  job.currentCode = fs.readFileSync(new URL('./out/asset_agent.js', import.meta.url), 'utf8');
  job.description = 'The same royal throne but gothic: black lacquered wood, pointed spire finials, deep purple velvet, sharper angular arms.';
}
const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(5) + 's';
const res = await fetch(`${BASE}/api/asset?via=${mode}${process.env.AGENT_MODEL ? '&agentModel=' + process.env.AGENT_MODEL : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) });
console.log(ts(), 'HTTP', res.status, res.headers.get('content-type'));
const dec = new TextDecoder(); let buf = '';
for await (const chunk of res.body) {
  buf += dec.decode(chunk, { stream: true }); let i;
  while ((i = buf.indexOf('\n\n')) >= 0) {
    const block = buf.slice(0, i); buf = buf.slice(i + 2);
    if (!block.startsWith('data:')) continue;
    const ev = JSON.parse(block.slice(5));
    if (ev.type === 'done') {
      console.log(ts(), `[${tag}] DONE via=${ev.via} model=${ev.model} ms=${ev.ms} code=${ev.code.length} chars`);
      fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
      fs.writeFileSync(new URL(`./out/asset_${tag}.js`, import.meta.url), ev.code);
    } else console.log(ts(), `[${tag}]`, ev.type, ev.text || ev.message);
  }
}
