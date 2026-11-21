// POST /api/patch: utterance -> gemini-4-hydrogen function calls -> sanitized ops + background jobs.
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_DIR, generateContent } from './lib.mjs';
import { spaceBlock, footprint, boxesOverlap, isFlat } from './space.mjs';
// Shop MCP and the pre-built catalog are optional at startup (their files are written by other agents): a half-written
// file must not stop the server, so they are imported dynamically and every use checks the export exists.
const SHOP = await import('./shop.mjs').catch(e => { console.log('shop.mjs not loaded: ' + e.message); return {}; });
const CATALOG = await import('./catalog.mjs').catch(e => { console.log('catalog.mjs not loaded: ' + e.message); return {}; });
const catalogObject = id => CATALOG.catalogObject?.(id) || null;
const pickCatalog = (q, o) => CATALOG.pickCatalog?.(q, o) || [];
export const shopStats = { hits: 0, catalog: 0, photo: 0, generated: 0, errors: 0, lastMs: 0, lastError: null };
import { productOptions, optionsPage, chooseProduct, PAGE_SIZE } from './options.mjs';

// Send the canvas screenshot (request.image) to Hydrogen on the fast path too. ?see=0 / FAST_SEE=0 turns it off.
export const FAST_SEE = process.env.FAST_SEE !== '0'; // on by default: measured +0.15 s median, same results (test/out/space_after_see.log)

export const PATCH_MODEL = process.env.PATCH_MODEL || 'gemini-4-hydrogen';
// Catalog first: the teammate's pre-built models are used whenever one fits; generation only for what it lacks.
// Shop MCP lookup on add (shop_query, options cards) is kept on disk but OFF unless SHOP_ON_ADD=1.
export const SHOP_ON_ADD = process.env.SHOP_ON_ADD === '1';
const CATALOG_BLOCK = CATALOG.catalogPromptBlock?.() || '';
const SYSTEM = fs.readFileSync(path.join(SERVER_DIR, 'prompts', 'orchestrator.txt'), 'utf8') + (CATALOG_BLOCK ? `\n\n${CATALOG_BLOCK}` : '');

// ---------- tool declarations ----------
const num = { type: 'number' };
const vec3 = desc => ({ type: 'object', properties: { x: num, y: num, z: num }, required: ['x', 'y', 'z'], description: desc });
const SHAPES = ['box', 'cylinder', 'sphere', 'cone', 'capsule', 'torus', 'plane', 'custom'];
const SURFACES = ['wall_back', 'wall_left', 'wall_right', 'floor', 'ceiling'];
const WALLS = ['wall_back', 'wall_left', 'wall_right'];
const material = {
  type: 'object', description: 'PBR material. roughness 0 = mirror-glossy, 1 = matte. opacity < 1 = transparent.',
  properties: { roughness: num, metalness: num, opacity: num, emissive: { type: 'string', description: 'hex color of emitted light' } },
};
const objectProps = {
  name: { type: 'string', description: "short human-readable name, e.g. 'gothic throne'" },
  shape: { type: 'string', enum: SHAPES, description: 'custom for any real furniture/decor; primitives only for abstract shapes the user literally asks for' },
  size: vec3('bounding-box size in meters in the object frame: x=width, y=height, z=depth (front-to-back)'),
  position: vec3('absolute world position of the BOTTOM-CENTER of the bounding box'),
  rotation_y_deg: { type: 'number', description: 'yaw in degrees; front faces local +Z. back wall 0, left wall 90, right wall -90' },
  color: { type: 'string', description: 'dominant color, hex like #3366ff' },
  material,
  parent: { type: 'string', description: 'id of the object this rests on, or "" for the floor' },
  catalog_id: { type: 'string', description: 'catalogId from SHOP CATALOG, copied exactly (e.g. "sofa/03-junction"), when a catalog item fits; size, name, look and price then come from the catalog. Omit for made-up objects. Never invent or alter an id.' },
  ...(SHOP_ON_ADD && { shop_query: { type: 'string', description: 'short product search phrase a shopper would type, 2-5 words with the color/material/style asked for, e.g. "grey modular sofa", "walnut round coffee table", "brass arc floor lamp". Required for every real-world item someone could buy; omit for surfaces, built-in architecture, primitives and fantasy pieces (a throne). On update_object: set it to swap the object for another product.' },
  max_price: { type: 'number', description: 'optional price cap in USD for the product search ("under $500" = 500; "cheaper" = just below its current price)' } }),
  description: { type: 'string', description: 'custom shape only: rich 40-90 word description for the 3D modeler (style, parts, materials, colors, finish), at rest' },
};
const decalProps = {
  name: { type: 'string', description: "short name, e.g. 'BMW logo'" },
  surface: { type: 'string', enum: WALLS },
  x: { type: 'number', description: 'horizontal offset of the center from the wall center, + = right when facing the wall' },
  y: { type: 'number', description: 'height of the center above the floor' },
  width: num, height: num,
  prompt: { type: 'string', description: 'complete self-contained image-generation prompt for a flat front-on image filling the frame' },
};
const TOOLS = [
  { name: 'add_object', description: 'Add a new object (furniture/decor = shape custom with description).',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'new unique id, e.g. throne1' }, ...objectProps },
      required: ['id', 'name', 'shape', 'size', 'position', 'rotation_y_deg', 'color', 'parent'] } },
  { name: 'update_object', description: 'Change fields of an existing object. Pass only changed fields as absolute values. A new description on a custom object rebuilds its model.',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'id of an existing object' },
      changes: { type: 'object', properties: objectProps, description: 'only the fields that change' } }, required: ['id', 'changes'] } },
  { name: 'remove_object', description: 'Delete an object.', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'set_surface', description: 'Change the color and/or finish of a wall, the floor or the ceiling. "The walls" = three calls.',
    parameters: { type: 'object', properties: { id: { type: 'string', enum: SURFACES }, color: { type: 'string', description: 'hex like #1a1a1a' }, material }, required: ['id'] } },
  { name: 'add_decal', description: 'Mount a generated flat image (logo, painting, poster, mural, sign) on a wall.',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'new unique id, e.g. bmw_logo1' }, ...decalProps },
      required: ['id', 'name', 'surface', 'x', 'y', 'width', 'height', 'prompt'] } },
  { name: 'update_decal', description: 'Change an existing decal. A new prompt regenerates the image; x/y/width/height/surface just move it.',
    parameters: { type: 'object', properties: { id: { type: 'string' }, changes: { type: 'object', properties: decalProps } }, required: ['id', 'changes'] } },
  { name: 'remove_decal', description: 'Delete a decal.', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'say', description: 'Short spoken confirmation or reply (max 10 words).', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
];

// ---------- sanitizing ----------
const r2 = v => Math.round(v * 100) / 100;
const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v)) ? v : (typeof v === 'string' && Number.isFinite(+v) && v.trim() !== '' ? +v : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const NAMED = { black: '#111111', white: '#f5f5f5', red: '#cc2222', green: '#2e8b3e', blue: '#2255cc', yellow: '#e8c422', orange: '#e07a1f',
  purple: '#6a3d9a', pink: '#e88aa8', brown: '#7a4a2a', gray: '#808080', grey: '#808080', gold: '#d4af37', silver: '#c0c0c0', beige: '#d8c8a8', navy: '#1f2a52', teal: '#1f8a8a' };
export function hex(c, d = '#808080') {
  if (typeof c !== 'string') return d;
  let s = c.trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  s = s.replace(/^#+/, '').replace(/^0x/, '');
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map(ch => ch + ch).join('');
  if (/^[0-9a-f]{8}$/.test(s)) s = s.slice(0, 6);
  return /^[0-9a-f]{6}$/.test(s) ? '#' + s : d;
}
function cleanMaterial(m) {
  if (!m || typeof m !== 'object') return undefined;
  const o = {};
  for (const k of ['roughness', 'metalness', 'opacity']) { const v = fin(m[k], undefined); if (v !== undefined) o[k] = r2(clamp(v, k === 'opacity' ? 0.05 : 0, 1)); }
  if (m.emissive !== undefined && m.emissive !== null && m.emissive !== '') o.emissive = hex(m.emissive, '#000000');
  return Object.keys(o).length ? o : undefined;
}
function cleanVec(v, d) {
  if (!v || typeof v !== 'object') return d && { ...d };
  return { x: r2(fin(v.x, d?.x ?? 0)), y: r2(fin(v.y, d?.y ?? 0)), z: r2(fin(v.z, d?.z ?? 0)) };
}
// Keep an object inside the room (rotation-aware footprint).
function fitObject(o, room) {
  const s = o.size;
  s.x = r2(clamp(s.x, 0.02, room.width)); s.y = r2(clamp(s.y, 0.01, room.height)); s.z = r2(clamp(s.z, 0.01, room.depth));
  const a = (o.rotation_y_deg || 0) * Math.PI / 180, c = Math.abs(Math.cos(a)), si = Math.abs(Math.sin(a));
  const ex = (s.x * c + s.z * si) / 2, ez = (s.x * si + s.z * c) / 2;
  const hx = Math.max(0, room.width / 2 - ex), hz = Math.max(0, room.depth / 2 - ez);
  o.position = { x: r2(clamp(o.position.x, -hx, hx)), y: r2(clamp(o.position.y, 0, Math.max(0, room.height - s.y))), z: r2(clamp(o.position.z, -hz, hz)) };
}
function fitDecal(d, room) {
  const wallW = d.surface === 'wall_back' ? room.width : room.depth;
  d.width = r2(clamp(d.width, 0.05, wallW)); d.height = r2(clamp(d.height, 0.05, room.height));
  const hx = Math.max(0, wallW / 2 - d.width / 2);
  d.x = r2(clamp(d.x, -hx, hx)); d.y = r2(clamp(d.y, d.height / 2, Math.max(d.height / 2, room.height - d.height / 2)));
}
const isSurf = s => SURFACES.includes(s);
const slug = s => String(s || 'item').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'item';

function normRoom(scene) {
  const r = scene?.room || {};
  return { width: fin(r.width, 6) || 6, depth: fin(r.depth, 5) || 5, height: fin(r.height, 2.8) || 2.8 };
}

// When a catalog size replaces the size the model planned with, keep the object against the same wall(s).
function reanchor(o, size, room) {
  const hx = room.width / 2, hz = room.depth / 2, before = footprint(o), after = footprint({ ...o, size });
  const p = { ...o.position };
  if (before.z0 + hz <= 0.15) p.z = r2(p.z + before.z0 - after.z0);
  if (before.x0 + hx <= 0.15) p.x = r2(p.x + before.x0 - after.x0);
  else if (hx - before.x1 <= 0.15) p.x = r2(p.x + before.x1 - after.x1);
  return p;
}

// Catalog models whose build() faces the wrong way: degrees to add to rotation_y_deg.
const CATALOG_ROT_FIX = { 'coffee-table/01-reclaimed-wood-coffee-table': 90 }; // model's long side runs front to back
function rotFix(o, prevCatalogId) {
  const add = CATALOG_ROT_FIX[o.product?.catalogId] || 0, undo = CATALOG_ROT_FIX[prevCatalogId] || 0;
  if (add - undo) o.rotation_y_deg = r2((o.rotation_y_deg || 0) + add - undo);
}

// Catalog product fields for a model-given catalog id. Unknown id -> best pickCatalog match on the name, else null (made-up).
function catalogFor(id, name, dropped) {
  if (!id) return null;
  const hit = catalogObject(id);
  if (hit) return hit;
  const alt = pickCatalog(String(name || id).replace(/[/_-]+/g, ' '), { limit: 1 })[0];
  const fb = alt && catalogObject(alt.catalogId);
  dropped.push(fb ? `adjusted: unknown catalog id ${id} -> ${alt.catalogId}` : `adjusted: unknown catalog id ${id}, kept as a made-up object`);
  return fb || null;
}

// ---------- real products (Shop MCP GLB first, then the catalog, then photo-only; else generated) ----------
// Not Gemini calls: outside the Gemini limiter. Each search gets 1.5 s; the whole step is capped at SHOP_CAP_MS.
const SHOP_CAP_MS = 1800;

function applyProduct(out, scene, r, product) {
  let op = null;
  for (let i = out.ops.length - 1; i >= 0; i--) if (out.ops[i].id === r.id && (out.ops[i].op === 'add' || out.ops[i].op === 'update')) { op = out.ops[i]; break; }
  if (!op) { // a swap that changed nothing else: buildOps dropped it as "no changes"
    op = { op: 'update', id: r.id, changes: {} }; out.ops.push(op);
    out.dropped = out.dropped.filter(d => d !== `update_object ${r.id} (no changes)`);
  }
  const glb = product.model_glb;
  const fields = { shape: 'custom', status: 'building', product, ...(glb ? { glb } : op.op === 'update' ? { glb: null } : {}) };
  Object.assign(op.op === 'add' ? op.object : op.changes, fields);
  const base = op.op === 'add' ? op.object : { ...(scene?.objects || []).find(o => o.id === r.id), ...op.changes };
  let job = out.jobs.find(j => j.kind === 'asset' && j.objectId === r.id);
  if (!job) { job = { kind: 'asset', objectId: r.id, name: base.name, description: base.description || r.description || base.name, size: base.size }; out.jobs.push(job); }
  delete job.glb; delete job.catalogId; delete job.image_url;
  if (glb) job.glb = glb; else if (product.catalogId) job.catalogId = product.catalogId; else if (product.image_url) job.image_url = product.image_url;
}

// Attach a real product to every object that came with a shop_query; options (cards) for the first one.
// Mutates out (ops, jobs, dropped). Returns { ms, picks, options } or null when nothing was shoppable.
export async function attachProducts(out, scene, { withOptions = true } = {}) {
  const reqs = out.shopReqs || [];
  if (!reqs.length) return null;
  const t0 = Date.now();
  let timer; const cap = new Promise(res => { timer = setTimeout(() => res(null), SHOP_CAP_MS); });
  const found = await Promise.all(reqs.map(r => Promise.race([
    productOptions(r.query, { maxPrice: r.maxPrice, exclude: r.exclude, page: 0 }).catch(e => { shopStats.errors++; shopStats.lastError = String(e.message || e).slice(0, 120); return null; }), cap])));
  clearTimeout(timer);
  const ms = Date.now() - t0, picks = [];
  let options;
  reqs.forEach((r, i) => {
    const list = found[i]?.products || [];
    if (found[i]?.errors?.length) { shopStats.errors++; shopStats.lastError = found[i].errors[0]; }
    const first = list[0];
    if (!first) { shopStats.generated++; picks.push(`${r.id}=generated`); return; }
    applyProduct(out, scene, r, first);
    if (first.model === 'glb') shopStats.hits++; else if (first.model === 'catalog') shopStats.catalog++; else shopStats.photo++;
    picks.push(`${r.id}=${first.model} "${first.title.slice(0, 40)}"`);
    if (withOptions && !options) options = { objectId: r.id, query: r.query, products: list.slice(0, PAGE_SIZE), page: 0, pageSize: PAGE_SIZE, more: found[i].more, chosen: 1 };
  });
  shopStats.lastMs = ms;
  return { ms, picks, options };
}

// Turn raw function calls into sanitized ops and derived jobs, simulating them on a copy of the scene.
export function buildOps(calls, scene) {
  const room = normRoom(scene);
  const objs = new Map((scene?.objects || []).map(o => [o.id, structuredClone(o)]));
  const decals = new Map((scene?.decals || []).map(d => [d.id, structuredClone(d)]));
  const ops = [], say = [], dropped = [], touched = new Set(), shopReqs = [];
  const uniq = (base, map) => { let id = slug(base), i = 2; const b = id; while (objs.has(id) || decals.has(id)) id = `${b}_${i++}`; return id; };

  for (const { name, args: a = {} } of calls) {
    if (name === 'say') { if (a.text) say.push(String(a.text)); continue; }
    if (name === 'add_object') {
      const id = uniq(a.id || a.name);
      const shape = SHAPES.includes(a.shape) ? a.shape : 'custom';
      const o = {
        id, name: String(a.name || id), shape,
        size: cleanVec(a.size, { x: 0.5, y: 0.5, z: 0.5 }), position: cleanVec(a.position, { x: 0, y: 0, z: 0 }),
        rotation_y_deg: r2(fin(a.rotation_y_deg, 0)), color: hex(a.color), parent: objs.has(a.parent) ? a.parent : '',
      };
      const m = cleanMaterial(a.material); if (m) o.material = m;
      if (shape === 'custom') { o.description = String(a.description || a.name || id); o.status = 'building'; }
      const cat = catalogFor(a.catalog_id, a.name, dropped);
      if (cat) { const p = reanchor(o, cat.size, room); Object.assign(o, cat, { size: { ...cat.size }, product: { ...cat.product }, position: p, shape: 'custom', status: 'building' }); rotFix(o); }
      if (SHOP_ON_ADD && !cat && shape === 'custom' && typeof a.shop_query === 'string' && a.shop_query.trim())
        shopReqs.push({ id, query: a.shop_query.trim().slice(0, 120), maxPrice: fin(a.max_price, undefined), name: o.name, description: o.description, color: o.color });
      const want = { ...o.position };
      fitObject(o, room);
      if (Math.abs(want.x - o.position.x) > 0.05 || Math.abs(want.z - o.position.z) > 0.05) dropped.push(`adjusted: ${id} pulled inside the room (${r2(want.x)},${r2(want.z)} -> ${o.position.x},${o.position.z})`);
      objs.set(id, o); ops.push({ op: 'add', id, object: o }); touched.add(id);
      continue;
    }
    if (name === 'update_object') {
      const cur = objs.get(a.id); if (!cur) { dropped.push(`update_object ${a.id}`); continue; }
      const ch = a.changes && typeof a.changes === 'object' ? a.changes : {};
      const c = {};
      if (typeof ch.name === 'string') c.name = ch.name;
      if (SHAPES.includes(ch.shape) && ch.shape !== cur.shape) c.shape = ch.shape;
      if (ch.size) c.size = cleanVec(ch.size, cur.size);
      if (ch.position) c.position = cleanVec(ch.position, cur.position);
      if (ch.rotation_y_deg !== undefined) c.rotation_y_deg = r2(fin(ch.rotation_y_deg, cur.rotation_y_deg || 0));
      if (ch.color !== undefined) c.color = hex(ch.color, cur.color);
      if (ch.material) { const m = cleanMaterial(ch.material); if (m) c.material = { ...(cur.material || {}), ...m }; }
      if (typeof ch.parent === 'string') c.parent = (ch.parent === '' || objs.has(ch.parent)) && ch.parent !== cur.id ? ch.parent : cur.parent;
      const swap = SHOP_ON_ADD && typeof ch.shop_query === 'string' && ch.shop_query.trim() && (cur.shape === 'custom' || c.shape === 'custom');
      if (swap) shopReqs.push({ id: cur.id, query: ch.shop_query.trim().slice(0, 120), maxPrice: fin(ch.max_price, undefined), name: c.name || cur.name,
        description: (typeof ch.description === 'string' && ch.description.trim()) || cur.description, color: c.color || cur.color, exclude: cur.product, update: true });
      const cat = ch.catalog_id ? catalogFor(ch.catalog_id, ch.name || cur.name, dropped) : null;
      if (cat && cat.product.catalogId !== cur.product?.catalogId) {
        const base = { ...cur, ...(c.position && { position: c.position }), ...(c.rotation_y_deg !== undefined && { rotation_y_deg: c.rotation_y_deg }) };
        Object.assign(c, cat, { size: { ...cat.size }, product: { ...cat.product }, position: reanchor(base, cat.size, room), glb: null });
        if (c.shape === cur.shape) delete c.shape;
        const r = { rotation_y_deg: c.rotation_y_deg ?? cur.rotation_y_deg, product: cat.product }; rotFix(r, cur.product?.catalogId); if (r.rotation_y_deg !== (c.rotation_y_deg ?? cur.rotation_y_deg)) c.rotation_y_deg = r.rotation_y_deg;
      }
      const finalShape = c.shape || cur.shape;
      if (finalShape === 'custom') {
        const newDesc = typeof ch.description === 'string' && ch.description.trim() ? ch.description.trim() : null;
        if (!cat && ((newDesc && newDesc !== cur.description) || c.shape === 'custom')) {
          c.description = newDesc || cur.description || c.name || cur.name;
          c.status = 'building';
          if (cur.product && !swap) c.product = null; // a described look replaces the product: the model is generated again
          if (cur.glb && !swap) c.glb = null;
        }
      }
      const merged = { ...cur, ...c };
      if (c.size || c.position || c.rotation_y_deg !== undefined) {
        const before = JSON.stringify(merged.position); fitObject(merged, room);
        if (c.size) c.size = merged.size;
        if (c.position || JSON.stringify(merged.position) !== before) c.position = merged.position;
      }
      if (!Object.keys(c).length) { dropped.push(`update_object ${a.id} (no changes)`); continue; }
      objs.set(cur.id, merged); ops.push({ op: 'update', id: cur.id, changes: c });
      if (c.position || c.size || c.rotation_y_deg !== undefined || c.parent !== undefined) touched.add(cur.id);
      continue;
    }
    if (name === 'remove_object') {
      if (!objs.has(a.id)) { dropped.push(`remove_object ${a.id}`); continue; }
      objs.delete(a.id); ops.push({ op: 'remove', id: a.id });
      continue;
    }
    if (name === 'set_surface') {
      if (!isSurf(a.id)) { dropped.push(`set_surface ${a.id}`); continue; }
      const c = {};
      if (a.color !== undefined && a.color !== null && a.color !== '') c.color = hex(a.color);
      const m = cleanMaterial(a.material);
      if (m) c.material = { ...(scene?.surfaces?.[a.id]?.material || {}), ...m };
      if (!Object.keys(c).length) { dropped.push(`set_surface ${a.id} (no changes)`); continue; }
      ops.push({ op: 'surface', id: a.id, changes: c });
      continue;
    }
    if (name === 'add_decal') {
      const id = uniq(a.id || a.name);
      const d = { id, name: String(a.name || id), surface: WALLS.includes(a.surface) ? a.surface : 'wall_back',
        x: r2(fin(a.x, 0)), y: r2(fin(a.y, 1.6)), width: r2(fin(a.width, 1)), height: r2(fin(a.height, 1)),
        prompt: String(a.prompt || a.name || 'abstract wall art'), status: 'building' };
      fitDecal(d, room);
      decals.set(id, d); ops.push({ op: 'add_decal', id, decal: d });
      continue;
    }
    if (name === 'update_decal') {
      const cur = decals.get(a.id); if (!cur) { dropped.push(`update_decal ${a.id}`); continue; }
      const ch = a.changes && typeof a.changes === 'object' ? a.changes : {};
      const c = {};
      if (typeof ch.name === 'string') c.name = ch.name;
      if (WALLS.includes(ch.surface) && ch.surface !== cur.surface) c.surface = ch.surface;
      for (const k of ['x', 'y', 'width', 'height']) if (ch[k] !== undefined) c[k] = r2(fin(ch[k], cur[k]));
      if (typeof ch.prompt === 'string' && ch.prompt.trim() && ch.prompt.trim() !== cur.prompt) { c.prompt = ch.prompt.trim(); c.status = 'building'; }
      const merged = { ...cur, ...c };
      if (['surface', 'x', 'y', 'width', 'height'].some(k => k in c)) { fitDecal(merged, room); for (const k of ['x', 'y', 'width', 'height']) if (k in c || merged[k] !== cur[k]) c[k] = merged[k]; }
      if (!Object.keys(c).length) { dropped.push(`update_decal ${a.id} (no changes)`); continue; }
      decals.set(cur.id, merged); ops.push({ op: 'update_decal', id: cur.id, changes: c });
      continue;
    }
    if (name === 'remove_decal') {
      if (!decals.has(a.id)) { dropped.push(`remove_decal ${a.id}`); continue; }
      decals.delete(a.id); ops.push({ op: 'remove_decal', id: a.id });
      continue;
    }
    dropped.push(`unknown ${name}`);
  }

  // Safety net: objects added/moved in this patch that overlap another object on the same support are slid to the
  // nearest free position (<= 0.8 m, along their wall if against one). Untouched objects never move.
  for (const id of touched) {
    const o = objs.get(id);
    if (!o || isFlat(o) || [...objs.values()].some(b => b.parent === id)) continue;
    const others = [...objs.values()].filter(b => b.id !== id && !isFlat(b) && (b.parent || '') === (o.parent || ''));
    const hit = (p, tol = 0.02) => { const f = footprint({ ...o, position: p }); return others.find(b => boxesOverlap(f, footprint(b), tol)); };
    const first = hit(o.position); if (!first) continue;
    const f0 = footprint(o), hx = room.width / 2, hz = room.depth / 2;
    let lockX = f0.x0 + hx <= 0.15 || hx - f0.x1 <= 0.15, lockZ = f0.z0 + hz <= 0.15;
    if (lockX && lockZ) lockX = lockZ = false;
    let best = null;
    const maxD = lockX || lockZ ? 1.5 : 0.8; // sliding along a wall may go a little further
    for (let d = 0.05; d <= maxD + 1e-4 && !best; d += 0.05) for (const [ax, sg] of [['x', 1], ['x', -1], ['z', 1], ['z', -1]]) {
      if ((ax === 'x' && lockX) || (ax === 'z' && lockZ)) continue;
      const p = { ...o.position, [ax]: r2(o.position[ax] + sg * d) };
      const f = footprint({ ...o, position: p });
      if (f.x0 < -hx - 1e-6 || f.x1 > hx + 1e-6 || f.z0 < -hz - 1e-6 || f.z1 > hz + 1e-6) continue;
      if (!hit(p, -0.08)) { best = p; break; } // land with >= 0.08 m clearance
    }
    if (!best) { dropped.push(`adjusted: none possible, ${id} overlaps ${first.id} (no free spot within ${maxD} m)`); continue; }
    dropped.push(`adjusted: ${id} moved (${o.position.x},${o.position.z}) -> (${best.x},${best.z}) to clear ${first.id}`);
    o.position = best;
    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i]; if (op.id !== id) continue;
      if (op.op === 'add') { op.object.position = { ...best }; break; }
      if (op.op === 'update') { op.changes.position = { ...best }; break; }
    }
  }

  // Jobs: one per object/decal that ends this patch in "building" state and still exists (last write wins).
  const jobs = [], seen = new Set();
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    if ((op.op === 'add' || op.op === 'update') && !seen.has('o' + op.id)) {
      const building = op.op === 'add' ? op.object.status === 'building' : op.changes.status === 'building';
      const o = objs.get(op.id);
      if (building && o) { seen.add('o' + op.id); jobs.unshift({ kind: 'asset', objectId: o.id, name: o.name, description: o.description, size: o.size, ...(o.product?.catalogId && { catalogId: o.product.catalogId }) }); }
    }
    if ((op.op === 'add_decal' || op.op === 'update_decal') && !seen.has('d' + op.id)) {
      const building = op.op === 'add_decal' || op.changes.status === 'building';
      const d = decals.get(op.id);
      if (building && d) { seen.add('d' + op.id); jobs.unshift({ kind: 'decal', decalId: d.id, prompt: d.prompt, width: d.width, height: d.height }); }
    }
  }
  return { ops, jobs, say: say.join(' ').trim(), dropped, shopReqs };
}

// ---------- designer path ----------
// Hydrogen (fast hands) routes whole-room / style / open-ended requests to a stronger planning model via ask_designer.
export const DESIGNER_MODEL = process.env.DESIGNER_MODEL || 'gemini-4-argon';
export const DESIGNER_TIMEOUT_MS = 30000;
const DESIGNER_THINKING = { 'gemini-4-argon': 'low', 'gemini-4-neon': 'low', 'gemini-4-carbon': 'low', 'gemini-4-hydrogen': 'low' }; // per-model thinking level; others use the model default
const ASK_DESIGNER = { name: 'ask_designer',
  description: 'Hand the request to the senior interior designer, who plans a complete coherent set of edits. Use for whole-room designs/themes, a style or mood for the room as a whole, and open-ended judgements ("this feels empty", "what would make it better?"). Call it ALONE: no other calls, no say.',
  parameters: { type: 'object', properties: { brief: { type: 'string', description: "the user's request restated as a clear design brief, including constraints from the utterance and history (things to keep, colors, mood)" } }, required: ['brief'] } };
const DESIGNER_TOOLS = TOOLS.map(t => t.name !== 'say' ? t : { ...t, description: 'One or two short sentences (max 40 words), spoken to the user, explaining the design idea.' });
const DESIGNER_SYSTEM = fs.readFileSync(path.join(SERVER_DIR, 'prompts', 'designer.txt'), 'utf8')
  .replace('{{SHARED}}', SYSTEM.slice(SYSTEM.indexOf('COORDINATES'), SYSTEM.indexOf('BEHAVIOR')).trim()) + (CATALOG_BLOCK ? `\n\n${CATALOG_BLOCK}` : '');
const declare = list => [{ functionDeclarations: list.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })) }];
const callsOf = js => (js.candidates?.[0]?.content?.parts || []).filter(p => p.functionCall).map(p => ({ name: p.functionCall.name, args: p.functionCall.args || {} }));
function imagePart(image) {
  const m = typeof image === 'string' && /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(image);
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}
function promptInput(scene, history, utterance, view) {
  return `CURRENT SCENE:\n${JSON.stringify(compactScene(scene))}\n\nRECENT HISTORY (oldest first):\n` +
    ((Array.isArray(history) ? history : []).slice(-6).map((h, i) => `${i + 1}. User: "${h.u}" -> Applied: ${h.applied}`).join('\n') || '(none)') +
    `\n\n${spaceBlock(scene, history, view)}\n\nUSER SAID: "${String(utterance).trim()}"`;
}

// Fast path: one Hydrogen call. Returns raw function calls. withDesigner=false reproduces the pre-designer behavior.
export async function orchestrate({ scene, history, utterance, view, image, options }, { model = PATCH_MODEL, thinkingLevel = 'low', withDesigner = true, timeoutMs = 30000, see = FAST_SEE } = {}) {
  const parts = [{ text: promptInput(scene, history, utterance, view) }];
  const ip = see && imagePart(image);
  if (ip) parts.push({ text: 'SCREENSHOT of the room as the user sees it right now:' }, ip);
  const hasOptions = !!(options?.products?.length && options.objectId);
  if (hasOptions) parts.push({ text: optionsText(options) });
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts }],
    tools: declare([...TOOLS, ...(withDesigner ? [ASK_DESIGNER] : []), ...(hasOptions ? [CHOOSE_OPTION, MORE_OPTIONS] : [])]),
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    generationConfig: { thinkingConfig: { thinkingLevel } },
  };
  return callsOf(await generateContent(model, body, { timeoutMs, label: 'patch', priority: 'high' }));
}

// Designer: one call to a planning model with the same scene tools (+ optional screenshot). Returns raw function calls.
export async function runDesigner({ scene, history, utterance, brief, image, view }, { model = DESIGNER_MODEL, thinkingLevel = DESIGNER_THINKING[model], timeoutMs = DESIGNER_TIMEOUT_MS, signal } = {}) {
  const parts = [{ text: promptInput(scene, history, utterance, view) + `\n\nDESIGN BRIEF: ${brief || utterance}` }];
  const ip = imagePart(image);
  if (ip) parts.push({ text: 'SCREENSHOT of the room as the user sees it right now:' }, ip);
  const body = {
    systemInstruction: { parts: [{ text: DESIGNER_SYSTEM }] },
    contents: [{ role: 'user', parts }],
    tools: declare(DESIGNER_TOOLS),
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    ...(thinkingLevel && { generationConfig: { thinkingConfig: { thinkingLevel } } }),
  };
  return callsOf(await generateContent(model, body, { timeoutMs, signal, label: 'designer', priority: 'high' }));
}

// Designer with a hedged Hydrogen fallback started at the same time (aborted when the designer succeeds).
async function design(req, scene, designerModel) {
  const fbCtl = new AbortController();
  const fallback = designerModel === PATCH_MODEL ? null
    : runDesigner(req, { model: PATCH_MODEL, thinkingLevel: 'low', timeoutMs: DESIGNER_TIMEOUT_MS, signal: fbCtl.signal }).catch(e => ({ error: e }));
  let why;
  try {
    const out = buildOps(await runDesigner(req, { model: designerModel }), scene);
    if (!out.ops.length) throw new Error('designer returned no edits');
    fbCtl.abort(new Error('designer answered'));
    return { ...out, model: designerModel };
  } catch (e) { why = String(e.message || e).slice(0, 120); }
  console.log(`designer ${designerModel} failed: ${why}`);
  const fb = fallback ? await fallback : { error: new Error('no fallback') };
  if (fb.error || !fb.length) return { ops: [], jobs: [], say: "Sorry, the designer couldn't finish that. Try a more specific request.", dropped: [`designer: ${why}`], model: designerModel };
  const out = buildOps(fb, scene);
  out.say = `The designer didn't answer in time, so here's my quick take. ${out.say}`.trim();
  out.dropped = [`designer: ${why}`, ...out.dropped];
  return { ...out, model: PATCH_MODEL };
}

// Compact scene for the prompt: only what the model needs, no code / image data.
function compactScene(scene) {
  const room = normRoom(scene);
  const v = p => p && { x: r2(fin(p.x, 0)), y: r2(fin(p.y, 0)), z: r2(fin(p.z, 0)) };
  const surfaces = {};
  for (const id of SURFACES) { const s = scene?.surfaces?.[id]; if (s) surfaces[id] = { color: s.color, ...(s.material && { material: s.material }) }; }
  return {
    room, surfaces,
    objects: (scene?.objects || []).map(o => ({ id: o.id, name: o.name, shape: o.shape, size: v(o.size), position: v(o.position),
      rotation_y_deg: o.rotation_y_deg || 0, color: o.color, ...(o.material && { material: o.material }), parent: o.parent || '',
      ...(o.product && { product: `${o.product.title} (${o.product.store}, ${o.product.price}${o.product.similar ? ', similar' : ''})` }),
      ...(o.shape === 'custom' && o.description && { description: o.description }) })),
    decals: (scene?.decals || []).map(d => ({ id: d.id, name: d.name, surface: d.surface, x: d.x, y: d.y, width: d.width, height: d.height, prompt: d.prompt })),
  };
}

// ---------- options on screen: choose_option / more_options ----------
const CHOOSE_OPTION = { name: 'choose_option', description: 'Pick one of the OPTIONS cards on screen by its number (also for "the leather one", "the cheapest of those"). Call it alone.',
  parameters: { type: 'object', properties: { number: { type: 'number', description: 'card number as shown (1-based, runs on across pages)' } }, required: ['number'] } };
const MORE_OPTIONS = { name: 'more_options', description: 'Show the next page of OPTIONS cards ("more", "show me others", "next"). Call it alone.', parameters: { type: 'object', properties: {} } };
function optionsText(o) {
  const start = o.page * o.pageSize;
  return `OPTIONS ON SCREEN (cards for object ${o.objectId}, search "${o.query}", card ${o.chosen || '-'} is in the room now):\n` +
    o.products.map((p, i) => `${start + i + 1}. ${p.title} | ${p.price} | ${p.store} | ${p.model || (p.model_glb ? 'glb' : p.catalogId ? 'catalog' : 'photo')}${p.similar ? ' | similar' : ''}`).join('\n') +
    `\nRules: a card number or a description of one card -> choose_option(number). "More / others / next" -> more_options(). A refinement ("darker", "cheaper", "leather", "under $500") -> update_object on ${o.objectId} with a new shop_query (+ max_price).`;
}

// POST /api/choose and choose_option: put a product on an existing object (no model call).
export function choose({ scene, objectId, product }) {
  const room = normRoom(scene);
  const out = chooseProduct(scene, objectId, product, {
    reanchor: (o, size) => reanchor(o, size, room),
    fit: ch => { const cur = (scene?.objects || []).find(o => o.id === objectId); const m = { ...cur, ...ch }; fitObject(m, room); ch.position = m.position; ch.size = m.size; },
  });
  return out;
}

export async function patch({ scene, history = [], utterance, image, view, options }, { designer, see } = {}) {
  if (typeof utterance !== 'string' || !utterance.trim()) { const e = new Error('utterance required'); e.status = 400; throw e; }
  const designerModel = /^gemini-[\w.-]+$/.test(designer || '') ? designer : DESIGNER_MODEL;
  const t0 = Date.now();
  const calls = await orchestrate({ scene, history, utterance, view, image, options }, { see: see ?? FAST_SEE });
  const pickC = calls.find(c => c.name === 'choose_option'), moreC = calls.find(c => c.name === 'more_options');
  if (options?.products?.length && (pickC || moreC)) {
    if (pickC) {
      const n = Math.round(fin(pickC.args.number, 0)), p = options.products[n - 1 - (options.page || 0) * (options.pageSize || PAGE_SIZE)];
      if (!p) return { ops: [], jobs: [], say: `Card ${n} isn't on screen.`, ms: Date.now() - t0, model: PATCH_MODEL, _dropped: [`choose_option ${n} not on screen`] };
      const r = choose({ scene, objectId: options.objectId, product: p });
      return { ops: r.ops, jobs: r.jobs, say: `Number ${n}: ${r.ops[0].changes.name}.`, ms: Date.now() - t0, model: PATCH_MODEL, options: { ...options, chosen: n }, _dropped: [] };
    }
    const { ms: _ms, ...opt } = await optionsPage(options.query, { page: (options.page || 0) + 1, objectId: options.objectId });
    return { ops: [], jobs: [], say: opt.products.length ? 'Here are a few more.' : 'That is all I found.', ms: Date.now() - t0, model: PATCH_MODEL, options: { ...opt, chosen: options.chosen }, _dropped: [] };
  }
  const ask = calls.find(c => c.name === 'ask_designer');
  if (ask) {
    const brief = String(ask.args.brief || utterance);
    const out = await design({ scene, history, utterance, brief, image, view }, scene, designerModel);
    const shop = SHOP_ON_ADD ? await attachProducts(out, scene, { withOptions: false }) : null; // designer adds many items: no cards
    return { ops: out.ops, jobs: out.jobs, say: out.say, ms: Date.now() - t0, model: out.model, brief, _dropped: out.dropped, _shop: shop };
  }
  const out = buildOps(calls, scene);
  const shop = SHOP_ON_ADD ? await attachProducts(out, scene) : null;
  return { ops: out.ops, jobs: out.jobs, say: out.say, ms: Date.now() - t0, model: PATCH_MODEL, ...(shop?.options && { options: shop.options }), _dropped: out.dropped, _shop: shop };
}
