// Real calls to Shop MCP (no Gemini). Run: node server/test/shop_test.mjs [--no-checkout]
// Creates real checkouts (no order is placed; nothing is paid) and prints their continue_url values.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shopSearch, shopFindCatalogItem, shopCheckout, shopSession } from '../shop.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', 'catalog', 'mock-shop', 'catalog.json'), 'utf8'));
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const line = p => `${p.title} | ${p.price} | ${p.store} (${p.shop}) | 3D: ${p.model_glb ? 'glb' : 'no'}\n      url: ${p.url}\n      img: ${p.image_url}`;

console.log('== search');
const queries = ['red velvet throne chair', 'mid-century walnut coffee table', 'arc floor lamp', 'boucle accent chair', 'rattan pendant light'];
const times = [];
const found = [];
for (const q of queries) {
  const r = await shopSearch(q, { limit: 3 });
  times.push(r.ms);
  console.log(`\n"${q}" ${r.ms} ms, ${r.products.length} products${r.warnings.length ? ', warnings: ' + r.warnings.join(' / ') : ''}`);
  for (const p of r.products) console.log('  - ' + line(p));
  found.push(...r.products);
}
console.log(`\nsearch latency: median ${median(times)} ms, worst ${Math.max(...times)} ms (n=${times.length})`);

const r3 = await shopSearch('red velvet throne chair', { limit: 3, model3d: true });
console.log(`\nwith model3d filter: ${r3.ms} ms`);
for (const p of r3.products) console.log(`  - ${p.title} | ${p.price} | glb ${p.model_glb} | usdz ${p.model_usdz}`);

console.log('\n== catalog lookups');
const kinds = ['sofa', 'coffee-table', 'floor-lamp', 'bed', 'armchair'];
let exact = 0;
for (const k of kinds) {
  const e = catalog.find(x => x.kind === k);
  const t = Date.now();
  const p = await shopFindCatalogItem(e);
  if (p?.match === 'exact') exact++;
  console.log(`  ${k}: "${e.name}" (${e.vendor}, ${e.store}) -> ${p ? `${p.match.toUpperCase()}: ${p.title} | ${p.price} | ${p.store}` : 'null'}  ${Date.now() - t} ms`);
}
console.log(`  exact hits: ${exact}/${kinds.length}`);

if (!process.argv.includes('--no-checkout')) {
  console.log('\n== checkout (two merchants)');
  // Two products from two different merchants, taken from the live search above.
  const a = found.find(p => p.available && p.shop);
  const b = found.find(p => p.available && p.shop && p.shop !== a.shop);
  const items = [{ url: a.url, quantity: 1 }, { url: b.url, quantity: 1 }, { catalogId: catalog[0].modelFile.replace(/\.build\.js$/, '') }];
  console.log('  items:', items.map(i => i.url || i.catalogId).join('\n         '));
  const out = await shopCheckout(items);
  console.log(`  ${out.ms} ms, ${out.checkouts.length} checkouts, ${out.failed.length} failed`);
  for (const c of out.checkouts) console.log(`  - ${c.store} [${c.status}] total ${c.total} titles ${JSON.stringify(c.titles)}${c.similar ? ' (similar product for a catalog item)' : ''}\n      continue_url: ${c.url}`);
  for (const f of out.failed) console.log(`  x ${f.title}: ${f.reason}`);
  // continue_url carries the checkout's access key: keep it out of the repo (written to the OS temp dir for curl checks).
  const f = path.join(os.tmpdir(), 'shop_checkout_urls.txt');
  fs.writeFileSync(f, out.checkouts.map(c => c.url).join('\n') + '\n');
  console.log(`  continue_urls written to ${f}`);
}
console.log(`\nShop MCP calls this run: ${shopSession.calls}, session id: ${shopSession.id ?? '(none: server is stateless)'}`);
