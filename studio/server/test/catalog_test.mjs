// Catalog check, no model calls: node server/test/catalog_test.mjs [--block] [--table]
// Validates every catalog model, prints the size table, the orchestrator prompt block and pickCatalog results.
import http from 'node:http';
import { loadCatalog, validateCatalog, catalogWarnings, catalogRecords, catalogStats, catalogPromptBlock, pickCatalog,
  catalogCode, catalogObject, catalogAssetEvent, handleCatalog } from '../catalog.mjs';

const t0 = Date.now();
const items = loadCatalog();
const st = catalogStats();
console.log(`[catalog] ${st.usable}/${st.total} usable; loaded + measured ${st.measured} models in ${st.ms} ms (module import incl. three: ${Date.now() - t0} ms after import)`);

const broken = validateCatalog();
console.log(`\n== excluded (${broken.length})`);
for (const b of broken) console.log(`  ${b.catalogId}: ${b.problems.join('; ')}`);
const warn = catalogWarnings();
console.log(`\n== warnings on usable models (${warn.length})`);
for (const w of warn) console.log(`  ${w.catalogId}: ${w.warnings.join('; ')}`);

console.log('\n== size table (W x H x D m, measured bbox -> size used; listing target when given)');
for (const r of catalogRecords()) {
  const b = r.bbox ? `${r.bbox.x}x${r.bbox.y}x${r.bbox.z}` : '-';
  const s = r.size ? `${r.size.x}x${r.size.y}x${r.size.z}` : '-';
  const t = r.listing ? `${r.listing.option}: ${r.listing.value}` : '';
  console.log(`  ${r.ok ? ' ' : 'X'} ${r.catalogId.padEnd(46)} ${b.padEnd(16)} ${s === b ? ''.padEnd(16) : ('-> ' + s).padEnd(16)} ${String(r.m?.meshes ?? '').padStart(3)} meshes  ${r.price.padStart(7)}  ${t}`);
}

console.log('\n== per-kind size ranges (usable)');
const byKind = {};
for (const it of items) (byKind[it.kind] ||= []).push(it);
for (const [k, list] of Object.entries(byKind)) {
  const rng = ax => `${Math.min(...list.map(i => i.size[ax])).toFixed(2)}-${Math.max(...list.map(i => i.size[ax])).toFixed(2)}`;
  console.log(`  ${k.padEnd(14)} W ${rng('x').padEnd(10)} H ${rng('y').padEnd(10)} D ${rng('z')}`);
}

const block = catalogPromptBlock();
console.log(`\n== prompt block: ${block.length} chars, ~${Math.round(block.length / 3.6)} tokens (chars/3.6), ${block.split('\n').length - 1} items`);
console.log(process.argv.includes('--block') ? block : block.split('\n').slice(0, 11).join('\n') + '\n  ... (--block for all)');

console.log('\n== pickCatalog');
const phrases = ['a couch', 'grey sofa', 'cheap sofa', 'cheap desk', 'a reading lamp', 'somewhere to sit', 'bedside table',
  'big wooden dining table', 'a rug', 'blue rug', 'office chair under 300', 'leather pouf', 'a chair', 'a bookshelf',
  'wardrobe for the kids', 'brass floor lamp', 'tv stand', 'throne', 'a grand piano', 'coffee table'];
for (const p of phrases) {
  const res = pickCatalog(p, { limit: 3 });
  console.log(`  "${p}" -> ${res.length ? res.map(r => `${r.catalogId} (${r.price}, ${r.score}${r.why ? ' ' + r.why : ''})`).join(' | ') : 'NOTHING (generate a custom model)'}`);
}
console.log(`  opts {kind:'sofa', maxPrice:500} -> ${pickCatalog('', { kind: 'sofa', maxPrice: 500 }).map(r => r.catalogId + ' ' + r.price).join(' | ')}`);
console.log(`  opts {color:'#2b2b2b'} "armchair" -> ${pickCatalog('armchair', { color: '#2b2b2b', limit: 3 }).map(r => r.catalogId + ' ' + r.score).join(' | ')}`);

// helpers used by patch/asset
const id = items[0].catalogId;
const ev = catalogAssetEvent(id);
console.log(`\n== helpers: catalogCode(${id}) ${catalogCode(id)?.length} chars; catalogCode('nope') ${catalogCode('nope')}; asset event ${ev.type} via ${ev.via} in ${ev.ms} ms`);
console.log('  catalogObject:', JSON.stringify(catalogObject('sofa/03-junction')));

// GET /api/catalog through a throwaway server on a random port
const srv = http.createServer((req, res) => { const url = new URL(req.url, 'http://x'); if (!handleCatalog(req, res, url)) { res.writeHead(404); res.end('no'); } });
await new Promise(r => srv.listen(0, r));
const port = srv.address().port;
const j = await (await fetch(`http://localhost:${port}/api/catalog`)).json();
const other = await fetch(`http://localhost:${port}/api/other`);
console.log(`  GET /api/catalog -> ${j.items.length} items, first: ${JSON.stringify(j.items[0])}; other route -> ${other.status}`);
srv.close();

let fail = 0;
const check = (c, msg) => { if (!c) { fail++; console.log('FAIL ' + msg); } };
check(pickCatalog('throne').length === 0, 'throne should match nothing');
check(pickCatalog('a couch')[0]?.kind === 'sofa', 'couch -> sofa');
check(pickCatalog('bedside table')[0]?.kind === 'nightstand', 'bedside table -> nightstand');
check(pickCatalog('a rug')[0]?.kind === 'rug', 'rug');
check(pickCatalog('cheap desk')[0]?.kind === 'desk', 'cheap desk');
check(items.every(i => i.url === '' && i.similar && i.model === 'catalog' && i.image_url.startsWith('https://cdn.shopify.com/')), 'url empty, similar, model catalog, live image_url');
console.log(fail ? `\n${fail} checks failed` : '\nall checks passed');
process.exitCode = fail ? 1 : 0;
