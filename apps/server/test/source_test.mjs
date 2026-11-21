// Streams /api/source, then checks product URLs load and images load through /api/img.
// Usage: node apps/server/test/source_test.mjs [race|agent|direct] [tag]
import fs from 'node:fs';
const mode = process.argv[2] || 'race', tag = process.argv[3] || mode;
const BASE = process.env.BASE || 'http://localhost:8787';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's';
const res = await fetch(`${BASE}/api/source?via=${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ objectId: 'throne1', name: 'gothic throne', description: 'gothic black throne chair with red velvet upholstery' }) });
console.log(ts(), 'HTTP', res.status);
let products = null; const dec = new TextDecoder(); let buf = '';
for await (const chunk of res.body) {
  buf += dec.decode(chunk, { stream: true }); let i;
  while ((i = buf.indexOf('\n\n')) >= 0) {
    const block = buf.slice(0, i); buf = buf.slice(i + 2);
    if (!block.startsWith('data:')) continue;
    const ev = JSON.parse(block.slice(5));
    if (ev.type === 'done') { products = ev.products; console.log(ts(), `[${tag}] DONE model=${ev.model} ms=${ev.ms}`); for (const p of ev.products) console.log('   ', JSON.stringify(p)); }
    else console.log(ts(), `[${tag}]`, ev.type, ev.text || ev.message);
  }
}
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./out/source_${tag}.json`, import.meta.url), JSON.stringify(products, null, 2));
for (const p of products || []) {
  let page = 'ERR', img = 'ERR';
  try { const r = await fetch(p.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) }); page = `${r.status} ${r.url.slice(0, 80)}`; } catch (e) { page = 'ERR ' + e.message; }
  try { const r = await fetch(`${BASE}/api/img?u=${encodeURIComponent(p.image_url)}`); const b = await r.arrayBuffer(); img = `${r.status} ${r.headers.get('content-type')} ${Math.round(b.byteLength / 1024)}KB`; } catch (e) { img = 'ERR ' + e.message; }
  console.log(`  page: ${page}\n  img via proxy: ${img}`);
}
