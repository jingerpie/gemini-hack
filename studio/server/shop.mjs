// Shop MCP client (https://mcp.shop.com/): live product search and real merchant checkouts.
// Docs: https://shop.dev/docs/quickstart.md, search.md, checkout.md, tools.md, errors.md
//
// Protocol notes (from the quickstart): every call is a JSON-RPC `tools/call` POSTed to the root URL. The server keeps
// no session, so there is no `initialize`; each request carries the protocol version and client info in
// `params._meta`, plus `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` headers that must match the body.
// Shop answers with plain JSON; we still accept an SSE body in case it ever streams.
//
// Challenge rules this file follows:
//   - live data: nothing is cached; every search / lookup / checkout goes to Shop MCP.
//   - URLs (product url, image url, continue_url) are passed through exactly as returned, never rebuilt.
//   - one checkout per merchant; the shopper pays on the merchant's page (continue_url). We never complete a checkout.
//
// Exports: shopSearch, shopPick3d, shopSimilar, shopFindCatalogItem, shopCheckout, handleShop (GET /api/shop/search, POST /api/checkout).
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ENDPOINT = 'https://mcp.shop.com/';
const PROTOCOL = '2026-07-28';
const CLIENT = { name: 'gemini-hack-studio', version: '1.0.0' };
const COUNTRY = process.env.SHOP_COUNTRY || 'US';
const CURRENCY = process.env.SHOP_CURRENCY || 'USD';
const CONTEXT = { address_country: COUNTRY, currency: CURRENCY };
const SEARCH_TIMEOUT_MS = 8000;
const CHECKOUT_TIMEOUT_MS = 15000;
const CATALOG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'catalog', 'mock-shop', 'catalog.json');

// The one in-memory "session". Shop MCP is stateless (no initialize), but if it ever hands out an Mcp-Session-Id we
// keep it and send it back. Node's fetch keeps the TLS connection alive between calls on its own.
const session = { id: null, calls: 0 };
let rpcId = 0;

class ShopError extends Error {
  constructor(message, { code, status, retryAfter, continueUrl, unknownOutcome } = {}) {
    super(message);
    Object.assign(this, { code, status, retryAfter, continueUrl, unknownOutcome });
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Parse a reply body: plain JSON, or an SSE stream whose `data:` lines carry JSON-RPC messages. */
function parseReply(text, contentType, id) {
  if (!/event-stream/i.test(contentType || '')) return JSON.parse(text);
  const msgs = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
    if (data) { try { msgs.push(JSON.parse(data)); } catch { /* keep-alive or partial */ } }
  }
  return msgs.find(m => m.id === id && ('result' in m || 'error' in m)) || msgs.at(-1) || {};
}

/** One HTTP round trip. Throws ShopError; never retries. Returns the JSON-RPC `result`. */
async function rpcOnce(tool, args, { timeoutMs, signal }) {
  const id = ++rpcId;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'MCP-Protocol-Version': PROTOCOL,
    'Mcp-Method': 'tools/call',
    'Mcp-Name': tool,
  };
  if (session.id) headers['Mcp-Session-Id'] = session.id;
  const body = JSON.stringify({
    jsonrpc: '2.0', id, method: 'tools/call',
    params: {
      name: tool, arguments: args,
      _meta: {
        'io.modelcontextprotocol/protocolVersion': PROTOCOL,
        'io.modelcontextprotocol/clientInfo': CLIENT,
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    },
  });
  const sig = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
  let res, text;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body, signal: sig });
    text = await res.text();
  } catch (e) {
    const timedOut = e?.name === 'TimeoutError' || /timeout/i.test(String(e?.message));
    // A request that may have reached the server: "sent" matters for writes (errors.md, Retries).
    throw new ShopError(timedOut ? `Shop MCP ${tool} timed out after ${timeoutMs} ms` : `Shop MCP ${tool} network error: ${e?.message || e}`,
      { code: timedOut ? 'timeout' : 'network', unknownOutcome: timedOut || !!res });
  }
  session.calls++;
  const sid = res.headers.get('mcp-session-id');
  if (sid) session.id = sid;
  let msg;
  try { msg = parseReply(text, res.headers.get('content-type'), id); }
  catch { throw new ShopError(`Shop MCP ${tool}: HTTP ${res.status}, unreadable body`, { status: res.status, code: res.ok ? 'bad_body' : 'http' }); }
  if (msg.error) throw new ShopError(`Shop MCP ${tool}: ${msg.error.message} (${msg.error.code})`, { status: res.status, code: 'request_error' });
  if (!res.ok) throw new ShopError(`Shop MCP ${tool}: HTTP ${res.status}`, { status: res.status, code: 'http' });
  const result = msg.result;
  if (!result) throw new ShopError(`Shop MCP ${tool}: empty result`, { code: 'bad_body' });
  if (result.isError && !result.structuredContent) {
    // "Shop MCP couldn't get an answer": no document, code in _meta.
    const err = result._meta?.['com.shopify/error'] || {};
    const textOut = (result.content || []).filter(p => p.type === 'text').map(p => p.text).join('\n');
    throw new ShopError(textOut || `Shop MCP ${tool} failed (${err.code || 'unknown'})`, {
      code: err.code || 'tool_error', retryAfter: err.retry_after, continueUrl: err.continue_url,
      unknownOutcome: err.code === 'ambiguous_outcome',
    });
  }
  return result; // may still have isError with a document (ucp.status "error"): callers read its messages
}

/**
 * Call a tool with the retry rules from errors.md.
 * Reads (search/lookup/get) are safe to repeat: one retry on timeout/network/upstream_unavailable/5xx, and on
 * rate_limited only when retry_after fits in the remaining budget.
 * Writes (create_checkout) carry an idempotency key and are NOT repeated after a timeout or ambiguous_outcome (we have
 * no checkout id to read back, so the outcome is unknown); they are repeated once, with the same key, only when the
 * request never got out (connection refused / DNS).
 */
async function rpc(tool, args, { timeoutMs, write = false, signal } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 1; ; attempt++) {
    const left = deadline - Date.now();
    try {
      return await rpcOnce(tool, args, { timeoutMs: Math.max(1000, left), signal });
    } catch (e) {
      if (attempt >= 2 || signal?.aborted) throw e;
      const left2 = deadline - Date.now();
      let wait = -1;
      if (write) {
        if (e.code === 'network' && !e.unknownOutcome) wait = 200;
      } else if (['timeout', 'network', 'upstream_unavailable'].includes(e.code) || (e.code === 'http' && e.status >= 500)) {
        wait = e.retryAfter ? e.retryAfter * 1000 : 250;
      } else if (e.code === 'rate_limited') {
        wait = e.retryAfter ? e.retryAfter * 1000 : 1000;
      }
      if (wait < 0 || wait + 1000 > left2) throw e;
      await sleep(wait);
    }
  }
}

// ---------- product mapping ----------

/** Integer minor units -> "$169.99" style display string with its currency. */
export function formatMoney(m) {
  if (!m || typeof m.amount !== 'number' || !m.currency) return '';
  try {
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: m.currency });
    return f.format(m.amount / 10 ** f.resolvedOptions().maximumFractionDigits);
  } catch { return `${m.amount} ${m.currency}`; }
}

const allMedia = (p, v) => [...(v?.media || []), ...(p?.media || [])];

/**
 * A Shop MCP product (search / lookup result) -> contract Product (types.ts). url, image_url and model_glb exactly as
 * returned. Fields starting with "_" are internal (ranking, checkout) and are removed by clean() before anything leaves
 * this module.
 */
function toProduct(p, v = p.variants?.[0]) {
  if (!v) return null;
  const media = allMedia(p, v);
  // First image a browser can show (HEIC/AVIF only as a last resort), else a video's preview frame.
  const images = media.filter(m => m.type === 'image');
  const image = images.find(m => !/\.(heic|heif|avif)(\?|$)/i.test(m.url)) || images[0] || media.find(m => m.preview?.url);
  const model = media.find(m => m.type === 'model_3d');
  const src = fmt => model?.sources?.find(s => s.format === fmt)?.url;
  const out = {
    title: p.title,
    price: formatMoney(v.price),
    store: v.seller?.name || v.seller?.domain || '',
    url: v.url,
    image_url: image ? (image.type === 'image' ? image.url : image.preview.url) : '',
    variant_id: v.id, // what create_checkout buys, exactly as returned
    shop: v.seller?.domain, // merchant for create_checkout, exactly as returned
    model_glb: model ? (src('glb') || (/\.glb(\?|$)/i.test(model.url) ? model.url : undefined)) : undefined,
    model_usdz: model ? src('usdz') : undefined,
    _id: p.id,
    _available: v.availability?.available !== false,
    _currency: v.price?.currency,
    _amount: v.price?.amount,
    _options: (v.options || []).map(o => `${o.name} ${o.label}`).join(' '),
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

/** Strip internal fields: what is left is exactly the contract Product (+ glb_mb on picks). */
const clean = p => p && Object.fromEntries(Object.entries(p).filter(([k, v]) => !k.startsWith('_') && v !== undefined));

const warningsOf = doc => (doc?.messages || []).filter(m => m.type === 'warning' || m.type === 'error').map(m => m.content);

// ---------- search ----------

async function searchRaw(query, { limit = 10, model3d = false, context, signal, timeoutMs = SEARCH_TIMEOUT_MS, ...filters } = {}) {
  const q = String(query || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!q) throw new ShopError('empty search query', { code: 'bad_query' });
  const f = { ...filters };
  if (model3d) f.media = [...(f.media || []), { type: 'model_3d' }];
  const catalog = { query: q, context: { ...CONTEXT, ...context }, pagination: { limit: Math.max(1, Math.min(50, limit | 0 || 10)) } };
  if (Object.keys(f).length) catalog.filters = f;
  const result = await rpc('search_catalog', { catalog }, { timeoutMs, signal });
  const doc = result.structuredContent;
  if (result.isError || !Array.isArray(doc?.products)) throw new ShopError(warningsOf(doc).join('; ') || 'search returned no products document', { code: 'search_failed' });
  return { products: doc.products.map(p => toProduct(p)).filter(Boolean), warnings: warningsOf(doc), total: doc.pagination?.total_count };
}

/**
 * Live product search (no relevance filtering: Shop's own ranking). Returns { products: Product[], ms, warnings, total }.
 * opts: limit (1-50, default 3), model3d (true = only listings with a 3D model), price { min, max } in minor units,
 * shops [domain], categories [taxonomy gid], context overrides; other keys pass through as Shop MCP filters.
 */
export async function shopSearch(query, { limit = 3, ...opts } = {}) {
  const t0 = Date.now();
  const want = Math.max(1, Math.min(50, limit | 0 || 3));
  // Shop filters after paging, so a page can come back short (limit 2 + model_3d gave 1). Ask for a few extra.
  const r = await searchRaw(query, { ...opts, limit: Math.min(50, want + 3) });
  return { products: r.products.slice(0, want).map(clean), ms: Date.now() - t0, warnings: r.warnings, total: r.total };
}

/** Look up products by id / variant id / product URL. Returns the raw document. */
async function lookup(ids, { signal } = {}) {
  const result = await rpc('lookup_catalog', { catalog: { ids, context: CONTEXT } }, { timeoutMs: SEARCH_TIMEOUT_MS, signal });
  return result.structuredContent || { products: [] };
}

// ---------- relevance (no model calls) ----------

const TAX = id => `gid://shopify/TaxonomyCategory/${id}`; // Shopify Standard Product Taxonomy
const LAMP = /\b(lamps?|lights?|lighting|torchieres?)\b/;
// Most specific first. req: matches the request text. head: the listing title must match (all, if an array).
// cats: taxonomy categories for a second, category-filtered search. reject: extra kind-specific exclusions.
const KINDS = [
  { kind: 'office chair', req: /\b(office|desk|task|gaming|ergonomic|computer) chairs?\b/, head: /\b(chairs?|seat(ing)?)\b/, cats: ['fr-12-2', 'fr-7-7'] },
  { kind: 'bar stool', req: /\b(bar|counter)? ?stools?\b/, head: /\bstools?\b/, cats: ['fr-7-12'], reject: /\b(step|foot|ladder|potty)\b/ },
  { kind: 'dining chair', req: /\b(dining|kitchen|side) chairs?\b/, head: /\bchairs?\b/, cats: ['fr-7-9'] },
  { kind: 'armchair', req: /\b(arm ?chairs?|accent chairs?|lounge chairs?|club chairs?|wing ?back|recliners?|reading chairs?|lounger)\b/, head: /\b(arm ?chairs?|chairs?|recliners?|loungers?|wing ?backs?)\b/, cats: ['fr-7-1', 'fr-7'] },
  { kind: 'sofa', req: /\b(sofas?|couch(es)?|sectionals?|loveseats?|settees?|chesterfields?)\b/, head: /\b(sofas?|couch(es)?|sectionals?|loveseats?|love seats?|settees?|chesterfields?|seaters?)\b/, cats: ['fr-22'] },
  { kind: 'coffee table', req: /\b(coffee|cocktail) tables?\b/, head: /\b(coffee|cocktail|center|centre) tables?\b/, cats: ['fr-24-1-1'] },
  { kind: 'nightstand', req: /\b(night ?stands?|bedside (tables?|cabinets?)|night tables?)\b/, head: /\b(night ?stands?|bedside|night tables?|end tables?)\b/, cats: ['fr-24-6'] },
  { kind: 'side table', req: /\b(side|end|accent) tables?\b/, head: /\b(side|end|accent|sofa|c|drink|nesting) tables?\b/, cats: ['fr-24-1-2', 'fr-24-1'] },
  { kind: 'console table', req: /\bconsole tables?\b/, head: /\bconsoles?\b/, cats: ['fr-24-1-4'] },
  { kind: 'tv stand', req: /\b(tv|television|media) (stands?|consoles?|units?|cabinets?)|entertainment (center|centre|unit)s?\b/, head: /\b(tv|television|media|entertainment)\b/, cats: ['fr-9', 'fr-4-10'] },
  { kind: 'dining table', req: /\b(dining|kitchen|dinner) tables?\b/, head: /\btables?\b/, cats: ['fr-24-4'], reject: /\b(coffee|side|end|console|bedside|night|accent|nesting)\b/ },
  { kind: 'desk', req: /\bdesks?\b(?! (lamp|chair))/, head: /\b(desks?|workstations?|writing tables?)\b/, cats: ['fr-12-1'], reject: /\b(organi[sz]er|mat|pad|lamp|shelf|riser|converter)\b/ },
  { kind: 'bookshelf', req: /\b(book ?(shel(f|ves)|cases?)|shelving( units?)?|etageres?|shelves)\b/, head: /\b(book ?(shel(f|ves)|cases?)|shel(f|ves|ving)|etageres?)\b/, cats: ['fr-19-1', 'fr-19'], reject: /\b(bracket|brackets|wall shelf|floating)\b/ },
  { kind: 'dresser', req: /\b(dressers?|chests? of drawers|drawer chests?)\b/, head: /\b(dressers?|chests?|drawers?)\b/, cats: ['fr-4-5'], reject: /\b(knobs?|pulls?|handles?|liners?|organi[sz]ers?)\b/ },
  { kind: 'wardrobe', req: /\b(wardrobes?|armoires?)\b/, head: /\b(wardrobes?|armoires?)\b/, cats: ['fr-4-1'] },
  { kind: 'sideboard', req: /\b(sideboards?|buffets?|credenzas?)\b/, head: /\b(sideboards?|buffets?|credenzas?)\b/, cats: ['fr-4-11', 'fr-4-2'] },
  { kind: 'cabinet', req: /\bcabinets?\b/, head: /\bcabinets?\b/, cats: ['fr-4'] },
  { kind: 'bed', req: /\b(beds?|bed ?frames?|four.posters?)\b/, head: /\b(beds?|bed ?frames?|bedframes?|four.posters?)\b/, cats: ['fr-2-2'], reject: /\b(mattress(es)?|toppers?|sheets?|duvets?|bedding|comforters?|bed ?skirts?|headboards? only|bed ?rails?|risers?|slats?|sofa ?beds?|day ?beds?|bunk)\b/ },
  { kind: 'bench', req: /\bbench(es)?\b/, head: /\bbench(es)?\b/, cats: ['fr-3'], reject: /\b(work ?bench|weight|press|potting)\b/ },
  { kind: 'ottoman', req: /\b(ottomans?|poufs?|pouffes?|footstools?|foot stools?)\b/, head: /\b(ottomans?|poufs?|pouffes?|footstools?|foot stools?)\b/, cats: ['fr-14'] },
  { kind: 'table', req: /\btables?\b/, head: /\btables?\b/, cats: ['fr-24'], reject: /\b(lamps?|runners?|cloths?|linens?|tennis|pool|ping)\b/ },
  { kind: 'floor lamp', req: /\b(floor|standing|arc|torchiere) lamps?\b/, head: LAMP, cats: ['hg-13-5-3'], reject: /\b(table|desk|bedside|nightstand|wall|ceiling|pendant)\b/ },
  { kind: 'table lamp', req: /\b(table|desk|bedside|nightstand|accent) lamps?\b/, head: LAMP, cats: ['hg-13-5-5', 'hg-13-5-2', 'hg-13-5-1'], reject: /\b(floor|standing|arc|ceiling|pendant|wall)\b/ },
  { kind: 'pendant light', req: /\b(pendants?|chandeliers?|ceiling (lights?|lamps?|fixtures?)|hanging (lights?|lamps?))\b/, head: /\b(pendants?|chandeliers?|ceiling|hanging|suspension)\b/, cats: ['hg-13-9-5', 'hg-13-9-3', 'hg-13-9-2'], reject: /\b(floor|table|desk|wall|necklace|earrings?|charm)\b/ },
  { kind: 'lamp', req: /\b(lamps?|lights?|lighting|sconces?)\b/, head: /\b(lamps?|lights?|lighting|sconces?|lanterns?)\b/, cats: ['hg-13-5', 'hg-13-9'] },
  { kind: 'rug', req: /\b(rugs?|carpets?|runners?)\b/, head: /\b(rugs?|carpets?|runners?|kilims?|dhurries?)\b/, cats: ['hg-3-57'], reject: /\b(pads?|grippers?|tape|anchors?|shampoo|cleaner)\b/ },
  { kind: 'mirror', req: /\bmirrors?\b/, head: /\bmirrors?\b/, cats: ['hg-3-47'], reject: /\b(compact|makeup|car|rear ?view|hand)\b/ },
  { kind: 'plant', req: /\b(plants?|fig|ficus|monstera|palms?|ferns?|succulents?|cactus|cacti|olive trees?|trees?|bonsai|pothos)\b/, head: /\b(plants?|figs?|ficus|monsteras?|palms?|ferns?|succulents?|cactus|cacti|trees?|olive|bonsai|pothos)\b/, cats: ['hg-17-3', 'hg-17-6', 'hg-3-2'], reject: /\b(planters?|plant stands?|seeds?|clips?|grow lights?|fertili[sz]ers?|food|trays?|hangers?|shelf|shelves|labels?|sticker|tees?|t-?shirts?)\b/ },
  { kind: 'chair', req: /\bchairs?\b/, head: /\bchairs?\b/, cats: ['fr-7'] },
];
// Accessories, toys and other things that share a furniture word. Ignored when the request itself uses the word.
const ACCESSORY = /\b(covers?|slip ?covers?|cushions?|pillows?|seat pads?|protectors?|replacements?|spare|legs?|leg sets?|feet|casters?|glides?|hardware|parts?|kits?|swatch(es)?|samples?|fabrics?|miniatures?|mini|doll ?house|dolls?|toys?|kids?|child(ren)?'?s?|toddlers?|baby|nursery|pets?|dogs?|cats?|puppy|rentals?|rent|incense|holders?|ornaments?|figurines?|keychains?|stickers?|decals?|posters?|prints?|canvas|paintings?|cakes?|candles?|bulbs?|cords?|throws?|blankets?|gift ?cards?|digital|downloads?|stl|templates?|blueprints?|plans|diy|patterns?|necklaces?|earrings?|pendant necklaces?|charms?|jewelry|shirts?|tees?|mugs?|books?|magnets?|models? kit|scale models?|1:\d+)\b/;
// Words that describe a listing rather than name it: they raise the score when the title has them.
const DESCRIPTORS = new Set(('grey gray black white cream beige ivory brown tan camel taupe walnut oak teak pine ash maple cherry mahogany acacia bamboo ' +
  'wood wooden timber velvet leather faux linen cotton wool jute sisal boucle bouclé chenille corduroy rattan wicker cane seagrass marble ' +
  'stone travertine concrete glass metal iron steel brass gold golden silver chrome copper bronze nickel red green blue navy teal pink blush ' +
  'yellow mustard orange rust terracotta purple plum emerald sage olive charcoal natural round oval square rectangular rectangle curved ' +
  'mid-century midcentury modern contemporary vintage retro rustic industrial scandinavian nordic japandi farmhouse boho bohemian coastal ' +
  'minimalist minimal traditional classic art deco tufted channel upholstered swivel reclining recliner modular sleeper corner l-shaped ' +
  'extendable extending storage drawer drawers glass-top marble-top small large oversized compact tall low arc tripod globe drum woven ' +
  'shag persian moroccan oriental abstract striped geometric floral outdoor king queen twin full canopy platform panel sleigh').split(/\s+/));
const SYN = { gray: 'grey', wooden: 'wood', timber: 'wood', midcentury: 'mid-century', rectangle: 'rectangular', golden: 'gold', bouclé: 'boucle', couch: 'sofa' };
// Request words that say nothing about which listing to pick.
const FILLER = new Set(('a an the and or with in on of for to my our this that some new nice big little cute cozy cosy comfy comfortable ' +
  'simple elegant luxury luxurious beautiful pretty stylish fancy plush soft sturdy solid piece set one two three 2 3 4 5 6 seat seater ' +
  'person people living room bedroom dining office kitchen home house space wall floor corner potted pot style styled looking type kind ' +
  'real please add put place me us it item thing furniture').split(/\s+/));

const words = s => norm(s).split(' ').filter(Boolean);
const stem = w => SYN[w] || (w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);

/** Work out what a request is asking for. */
function analyse({ name = '', description = '', query = '', color = '' }) {
  const nameText = norm(`${query} ${name}`);
  const all = norm(`${query} ${name} ${description}`);
  const kind = KINDS.find(k => k.req.test(nameText)) || KINDS.find(k => k.req.test(all)) || null;
  const kindWords = new Set(kind ? [...nameText.matchAll(new RegExp(kind.req.source, 'g'))].flatMap(m => words(m[0])).map(stem) : []);
  const colorWord = /^#/.test(color) ? '' : norm(color);
  const descriptors = [...new Set([...words(all), ...words(colorWord)].map(stem).filter(w => DESCRIPTORS.has(w) || DESCRIPTORS.has(SYN[w])))];
  // Distinctive words in the name (not a descriptor, filler or the kind's own words): "throne", "fiddle", "leaf".
  // They are required in the title, so "throne" never comes back as an ordinary chair.
  const distinct = [...new Set(words(nameText).map(stem))].filter(w => w.length > 2 && !FILLER.has(w) && !DESCRIPTORS.has(w) && !kindWords.has(w) && !/^\d/.test(w));
  const head = kind ? kind.head : (distinct.length ? new RegExp(`\\b(${distinct.map(w => w.replace(/[^a-z0-9-]/g, '')).join('|')})(e?s)?\\b`) : null);
  const required = kind ? distinct : distinct.slice(1); // without a kind, the first distinctive word is already the head
  const allowed = new Set(words(all)); // accessory words the request itself uses are not rejected
  const q = norm(query) || [colorWord, ...descriptors.filter(d => !words(name).map(stem).includes(d)).slice(0, 3), norm(name)].filter(Boolean).join(' ');
  return { kind, head, required, descriptors, allowed, query: q || norm(description).split(' ').slice(0, 8).join(' ') };
}

/** Why a listing fails the request, or '' when it passes. */
function rejectReason(p, a) {
  const t = norm(p.title);
  const heads = Array.isArray(a.head) ? a.head : [a.head];
  if (!a.head || !heads.every(h => h.test(t))) return 'not the right kind of thing';
  const acc = t.match(new RegExp(ACCESSORY.source, 'g'))?.find(w => !w.split(' ').every(x => a.allowed.has(x)));
  if (acc) return `accessory/toy word "${acc}"`;
  const kr = a.kind?.reject && t.match(new RegExp(a.kind.reject.source, 'g'))?.find(w => !w.split(' ').every(x => a.allowed.has(x)));
  if (kr) return `"${kr}" is a different kind`;
  const tw = new Set(words(t).map(stem));
  const miss = a.required.find(w => !tw.has(w) && !t.includes(w));
  if (miss) return `title lacks "${miss}"`;
  if (!p._available) return 'not available';
  return '';
}

function score(p, a, rank, fromCat) {
  const tw = new Set(words(`${p.title} ${p._options}`).map(stem));
  let s = 10 - rank * 0.4 + (fromCat ? 1 : 0);
  for (const d of a.descriptors) if (tw.has(d)) s += 2;
  s += p._currency === CURRENCY ? 3 : -3;
  return s;
}

/** HEAD a GLB for its size in bytes (null when unknown). */
async function glbBytes(url, timeoutMs) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(Math.max(100, timeoutMs)) });
    const n = +r.headers.get('content-length');
    return r.ok && n > 0 ? n : null;
  } catch { return null; }
}

/** Search (with the kind's taxonomy categories in parallel), merge, filter by relevance, rank. */
async function relevantCandidates(a, { model3d, maxPrice, limit, signal, timeoutMs }) {
  const base = { model3d, limit, signal, timeoutMs, ...(maxPrice ? { price: { max: Math.round(maxPrice * 100) } } : {}) };
  const runs = [searchRaw(a.query, base)];
  if (a.kind?.cats) runs.push(searchRaw(a.query, { ...base, categories: a.kind.cats.map(TAX) }));
  const res = await Promise.allSettled(runs);
  if (res.every(r => r.status === 'rejected')) throw res[0].reason;
  const seen = new Set(); const keys = new Set(); const pool = []; const rejected = [];
  // Category-filtered results first: they are the right kind of product by Shop's own taxonomy.
  [...res].reverse().forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const fromCat = a.kind?.cats && i === 0;
    r.value.products.forEach((p, rank) => {
      if (seen.has(p._id)) return; seen.add(p._id);
      if (model3d && !p.model_glb) return;
      const why = rejectReason(p, a);
      if (why) { rejected.push(`${p.title.slice(0, 60)}: ${why}`); return; }
      const key = dedupeKey(p); // colour variants of one listing count once
      if (keys.has(key)) return; keys.add(key);
      pool.push({ p, s: score(p, a, rank, fromCat) });
    });
  });
  pool.sort((x, y) => y.s - x.s);
  return { pool, rejected, seen: seen.size };
}

/**
 * Pick the best live listing WITH a merchant 3D model (GLB) for a requested object. No model calls.
 * Returns { product, alternatives, ms, why } (product/alternatives are Product + glb_mb), or { product: null, why, ms }
 * when nothing relevant has a model: the caller then generates geometry instead.
 * maxPrice is in whole currency units (e.g. 500 = $500).
 */
export async function shopPick3d({ name = '', description = '', query = '', color = '', maxPrice } = {}, { budgetMs = 1500 } = {}) {
  const t0 = Date.now();
  const deadline = t0 + budgetMs;
  const a = analyse({ name, description, query, color });
  if (!a.head) return { product: null, alternatives: [], ms: 0, why: 'could not tell what kind of object this is' };
  let found;
  try {
    found = await relevantCandidates(a, { model3d: true, maxPrice, limit: 10, signal: AbortSignal.timeout(budgetMs), timeoutMs: budgetMs });
  } catch (e) {
    return { product: null, alternatives: [], ms: Date.now() - t0, why: `Shop search failed: ${e.message}` };
  }
  const { pool, rejected, seen } = found;
  const label = a.kind?.kind || 'object';
  if (!pool.length) return { product: null, alternatives: [], ms: Date.now() - t0, why: `no relevant ${label} with a 3D model among ${seen} listings for "${a.query}"${rejected.length ? ` (rejected: ${rejected.slice(0, 4).join('; ')})` : ''}` };
  // GLB sizes for the top candidates, in parallel, inside what is left of the budget (max 1 s).
  const top = pool.slice(0, 8);
  const left = Math.min(1000, deadline - Date.now());
  const sizes = left > 80 ? await Promise.all(top.map(c => glbBytes(c.p.model_glb, left))) : top.map(() => null);
  const ranked = [];
  top.forEach((c, i) => {
    const b = sizes[i];
    if (b && b > 20e6) return; // too heavy to load in a demo
    const s = c.s + (b == null ? -1 : b < 8e6 ? 2 : 0);
    ranked.push({ ...c, s, mb: b ? Math.round(b / 1e5) / 10 : undefined });
  });
  ranked.sort((x, y) => y.s - x.s);
  if (!ranked.length) return { product: null, alternatives: [], ms: Date.now() - t0, why: `every relevant ${label} has a GLB over 20 MB` };
  const out = ranked.slice(0, 5).map(c => ({ ...clean(c.p), glb_mb: c.mb }));
  const [best, ...alternatives] = out;
  const matched = a.descriptors.filter(d => words(`${best.title} ${ranked[0].p._options}`).map(stem).includes(d));
  return {
    product: best, alternatives, ms: Date.now() - t0,
    why: `${label}: ${pool.length}/${seen} listings relevant; picked "${best.title}" (${best.store}, ${best.price}, GLB ${best.glb_mb ?? '?'} MB${matched.length ? `, matches ${matched.join('/')}` : ''})`,
  };
}

/**
 * Up to 3 buyable live products like a requested object, with or without a 3D model (for objects whose model was
 * generated or came from the demo catalog). Each is marked similar: true. Returns { products, ms, why }.
 */
export async function shopSimilar({ name = '', description = '', query = '', color = '', maxPrice } = {}, { limit = 3, signal } = {}) {
  const t0 = Date.now();
  const a = analyse({ name, description, query, color });
  if (!a.head) return { products: [], ms: 0, why: 'could not tell what kind of object this is' };
  const { pool, seen } = await relevantCandidates(a, { model3d: false, maxPrice, limit: 12, signal, timeoutMs: SEARCH_TIMEOUT_MS });
  const products = pool.slice(0, limit).map(c => ({ ...clean(c.p), similar: true }));
  return { products, ms: Date.now() - t0, why: `${pool.length}/${seen} listings relevant for "${a.query}"` };
}

/** Same product in another colour / size from the same store -> same key. */
function dedupeKey(p) {
  const base = String(p.title).split(/\s[-|–—]\s|\s\|\s|,|\(/)[0];
  return `${norm(p.store)}|${words(base).map(stem).filter(w => !DESCRIPTORS.has(w)).join(' ')}`;
}

/**
 * Numbered options panel: a stable, relevance-ranked list of live products for a request, paged.
 * Order: relevant listings WITH a merchant GLB first (model: "glb": in the room in seconds, the exact buyable item),
 * then relevant listings without one (model: "photo": geometry generated from the product photo). Junk (covers,
 * cushions, toys, samples, parts...) is rejected; colour variants of one product and repeat listings are merged; a page
 * holds one listing per merchant when it can.
 * Stability: every call ranks the same fixed window (the first 50 results of each search), so the same request + page
 * gives the same cards and page n+1 never repeats page n. `more` is false once that window is used up.
 * `exclude`: variant ids / urls / titles to leave out (e.g. what is already in the room); keep it the same across pages.
 * Returns { products: (Product & { model: "glb" | "photo" })[], page, pageSize, more, ms, total, why }.
 */
export async function shopOptions({ name = '', description = '', query = '', color = '', maxPrice } = {}, { page = 0, pageSize = 3, budgetMs = 1500, exclude = [] } = {}) {
  const t0 = Date.now();
  page = Math.max(0, page | 0); pageSize = Math.max(1, Math.min(10, pageSize | 0 || 3));
  const a = analyse({ name, description, query, color });
  if (!a.head) return { products: [], page, pageSize, more: false, ms: 0, total: 0, why: 'could not tell what kind of object this is' };
  const signal = AbortSignal.timeout(budgetMs);
  const price = maxPrice ? { price: { max: Math.round(maxPrice * 100) } } : {};
  const cats = a.kind?.cats ? { categories: a.kind.cats.map(TAX) } : null;
  // Category-filtered runs first: the right kind of product by Shop's own taxonomy.
  const runs = [
    cats && { model3d: true, ...cats }, { model3d: true },
    cats && { model3d: false, ...cats }, { model3d: false },
  ].filter(Boolean);
  const res = await Promise.allSettled(runs.map(r => searchRaw(a.query, { ...r, ...price, limit: 50, signal, timeoutMs: budgetMs })));
  if (res.every(r => r.status === 'rejected')) return { products: [], page, pageSize, more: false, ms: Date.now() - t0, total: 0, why: `Shop search failed: ${res[0].reason?.message}` };
  const ex = new Set(exclude.map(x => String(x)));
  const exT = new Set(exclude.map(norm));
  const seenId = new Set(); const seenKey = new Set(); const cands = []; let rejected = 0;
  res.forEach((r, ri) => {
    if (r.status !== 'fulfilled') return;
    r.value.products.forEach((p, rank) => {
      if (seenId.has(p._id)) return; seenId.add(p._id);
      if (rejectReason(p, a)) { rejected++; return; }
      if (ex.has(p.variant_id) || ex.has(p.url) || ex.has(p._id) || exT.has(norm(p.title))) return;
      const key = dedupeKey(p);
      if (seenKey.has(key)) return; seenKey.add(key);
      cands.push({ p, glb: !!p.model_glb, s: score(p, a, rank, !!runs[ri].categories) });
    });
  });
  // Tier (GLB first), then score; ties keep Shop's order (stable sort).
  cands.sort((x, y) => (y.glb - x.glb) || (y.s - x.s));
  // Pages with one listing per merchant when possible.
  const ordered = []; const left = [...cands];
  while (left.length) {
    const stores = new Set();
    for (let slot = 0; slot < pageSize && left.length; slot++) {
      let i = left.findIndex(c => !stores.has(c.p.store));
      if (i < 0) i = 0;
      stores.add(left[i].p.store);
      ordered.push(left.splice(i, 1)[0]);
    }
  }
  const slice = ordered.slice(page * pageSize, (page + 1) * pageSize);
  const products = slice.map(c => ({ ...clean(c.p), model: c.glb ? 'glb' : 'photo' }));
  const glbs = cands.filter(c => c.glb).length;
  return {
    products, page, pageSize, more: ordered.length > (page + 1) * pageSize, ms: Date.now() - t0, total: ordered.length,
    why: `${a.kind?.kind || 'object'} "${a.query}": ${ordered.length} relevant (${glbs} with GLB), ${rejected} rejected${res.some(r => r.status === 'rejected') ? '; some searches timed out' : ''}`,
  };
}

// ---------- catalog entries ----------

function readCatalog() {
  try { return JSON.parse(fs.readFileSync(CATALOG, 'utf8')); } catch { return []; }
}
/** catalogId ("sofa/03-junction") -> catalog.json entry. Reads the local file each time (it is our own data, not Shop results). */
export function catalogEntry(catalogId) {
  const want = String(catalogId || '').replace(/\.build\.js$/, '') + '.build.js';
  return readCatalog().find(e => e.modelFile === want) || null;
}

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9:-]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Live Shop MCP product for a catalog.json entry. The catalog came from mock.shop (Shopify's demo storefront), which is
 * not in Shop MCP (lookup by its product URL is not_found), so after the exact lookup this returns the closest real
 * product by the same relevance rules, marked similar: true. Returns Product (+ catalogId) or null.
 */
export async function shopFindCatalogItem(entry, { signal } = {}) {
  if (!entry) return null;
  const catalogId = entry.modelFile?.replace(/\.build\.js$/, '');
  const mockUrl = entry.store && entry.handle ? `https://${entry.store}.mock.shop/products/${entry.handle}` : null;
  const [exact, sim] = await Promise.allSettled([
    mockUrl ? lookup([mockUrl], { signal }) : Promise.resolve({ products: [] }),
    shopSimilar({ name: entry.productType || entry.kind, description: entry.name }, { limit: 1, signal }),
  ]);
  const hit = exact.status === 'fulfilled' ? exact.value.products?.[0] : null;
  if (hit) { const p = toProduct(hit); if (p) return { ...clean(p), catalogId }; }
  if (sim.status !== 'fulfilled') { if (exact.status === 'rejected') throw sim.reason; return null; }
  const p = sim.value.products[0];
  return p ? { ...p, catalogId, similar: true } : null;
}

// ---------- checkout ----------

/** Resolve one checkout item to { title, shop, store, variant_id, quantity, similar } or throw with a reason. */
async function resolveItem(item, { signal }) {
  const quantity = Math.max(1, Math.min(99, item.quantity | 0 || 1));
  if (item.variantId && item.shop) {
    // Straight from a Shop MCP listing we showed: no lookup. The merchant confirms price and stock at checkout.
    return { title: item.title || 'item', shop: item.shop, store: item.shop, variant_id: item.variantId, quantity, similar: false };
  }
  if (item.url) {
    const doc = await lookup([item.url], { signal });
    let best = null;
    for (const p of doc.products || []) for (const v of p.variants || []) {
      const m = (v.inputs || []).find(i => i.id === item.url)?.match;
      if (!best || (m === 'exact' && best.m !== 'exact')) best = { p, v, m };
    }
    if (!best) throw Object.assign(new Error('Shop could not find this product any more'), { title: item.title || item.url });
    // If the URL names a variant (?variant=123) keep that exact variant even when Shop marks it "featured".
    const want = /[?&]variant=(\d+)/.exec(item.url)?.[1];
    const v = want ? (best.p.variants.find(x => x.id.endsWith('/' + want)) || best.v) : best.v;
    if (!v.seller?.domain) throw Object.assign(new Error('product has no merchant to check out with'), { title: best.p.title });
    return { title: best.p.title, shop: v.seller.domain, store: v.seller.name || v.seller.domain, variant_id: v.id, quantity, similar: false };
  }
  if (item.catalogId) {
    const entry = catalogEntry(item.catalogId);
    if (!entry) throw Object.assign(new Error('not in the catalog'), { title: item.title || item.catalogId });
    const p = await shopFindCatalogItem(entry, { signal });
    if (!p) throw Object.assign(new Error('no live Shop product found for this catalog item'), { title: entry.name });
    return { title: p.title, shop: p.shop, store: p.store, variant_id: p.variant_id, quantity, similar: !!p.similar };
  }
  if (item.title) {
    const r = await shopSimilar({ name: item.title }, { limit: 3, signal });
    const p = r.products.find(x => norm(x.title) === norm(item.title)) || r.products[0];
    if (!p) throw Object.assign(new Error('no live Shop product matches this'), { title: item.title });
    return { title: p.title, shop: p.shop, store: p.store, variant_id: p.variant_id, quantity, similar: norm(p.title) !== norm(item.title) };
  }
  throw Object.assign(new Error('item needs variantId + shop, url, catalogId or title'), { title: '(unnamed item)' });
}

/** Opens one checkout at one merchant. Returns the checkout document. */
async function createCheckout(shop, lines, { signal }) {
  const args = {
    shop,
    checkout: { line_items: lines.map(l => ({ item: { id: l.variant_id }, quantity: l.quantity })), context: { address_country: COUNTRY } },
    meta: { 'idempotency-key': randomUUID() },
  };
  const result = await rpc('create_checkout', args, { timeoutMs: CHECKOUT_TIMEOUT_MS, write: true, signal });
  return result.structuredContent || {};
}

/**
 * Real checkouts, one per merchant. items: CheckoutRequest["items"].
 * Returns CheckoutResponse: { checkouts: [{ store, url (continue_url, untouched), titles, total?, similar?, status?, warnings? }], failed: [{ title, reason }], ms }
 * A checkout that comes back "incomplete" (no address yet) is normal: the shopper adds it on the merchant's page.
 */
export async function shopCheckout(items, { signal } = {}) {
  const t0 = Date.now();
  const failed = [];
  const list = Array.isArray(items) ? items.slice(0, 50) : [];
  const resolved = await Promise.allSettled(list.map(it => resolveItem(it, { signal })));
  const groups = new Map(); // shop domain -> { store, lines }
  resolved.forEach((r, i) => {
    if (r.status === 'rejected') { failed.push({ title: r.reason?.title || list[i]?.title || list[i]?.catalogId || list[i]?.url || 'item', reason: r.reason?.message || String(r.reason) }); return; }
    const it = r.value;
    const g = groups.get(it.shop) || { store: it.store, lines: [] };
    if (g.store === it.shop && it.store !== it.shop) g.store = it.store; // prefer a real store name over the domain
    const same = g.lines.find(l => l.variant_id === it.variant_id);
    if (same) same.quantity += it.quantity; else g.lines.push({ ...it });
    groups.set(it.shop, g);
  });
  const checkouts = [];
  await Promise.all([...groups].map(async ([shop, g]) => {
    try {
      const doc = await createCheckout(shop, g.lines, { signal });
      const url = doc.continue_url || null;
      if (!url) {
        const why = (doc.messages || []).filter(m => m.type === 'error').map(m => m.content).join('; ') || 'merchant returned no checkout link';
        for (const l of g.lines) failed.push({ title: l.title, reason: why });
        return;
      }
      // Titles from the merchant's own checkout lines when present (variantId items carry no title of their own).
      const lineTitle = id => (doc.line_items || []).find(li => li.item?.id === id)?.item?.title;
      const total = (doc.totals || []).find(t => t.type === 'total');
      const c = {
        store: g.store,
        url, // continue_url exactly as returned: every query parameter kept
        titles: g.lines.map(l => { const t = l.title === 'item' ? (lineTitle(l.variant_id) || l.title) : l.title; return l.quantity > 1 ? `${t} ×${l.quantity}` : t; }),
        total: total ? formatMoney({ amount: total.amount, currency: doc.currency }) : undefined,
        status: doc.status,
        warnings: (doc.messages || []).filter(m => m.type === 'warning').map(m => m.content),
      };
      if (g.lines.some(l => l.similar)) c.similar = true;
      if (!c.total) delete c.total;
      checkouts.push(c);
    } catch (e) {
      const reason = e.unknownOutcome
        ? `checkout request did not finish (${e.message}); not retried to avoid a duplicate`
        : e.continueUrl ? `${e.message} (merchant page: ${e.continueUrl})` : e.message;
      for (const l of g.lines) failed.push({ title: l.title, reason });
    }
  }));
  return { checkouts, failed, ms: Date.now() - t0 };
}

// ---------- HTTP ----------

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': '*' };
async function readJson(req, limit = 1024 * 1024) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) { const e = new Error('body too large'); e.status = 413; throw e; } chunks.push(c); }
  if (!n) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const e = new Error('invalid JSON body'); e.status = 400; throw e; }
}
function json(res, status, obj) {
  if (res.headersSent) return;
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

/**
 * GET  /api/shop/search?q=...&limit=3&model=1   -> ShopSearchResponse { products, ms }
 * POST /api/checkout  (CheckoutRequest)          -> CheckoutResponse
 * Returns false for any other path (so index.mjs can fall through), true once it has answered.
 */
export async function handleShop(req, res, url, note = () => {}) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/shop/search') {
    const q = url.searchParams.get('q') || '';
    if (!q.trim()) { json(res, 400, { error: 'q required' }); return true; }
    try {
      const out = await shopSearch(q, { limit: +(url.searchParams.get('limit') || 3), model3d: url.searchParams.get('model') === '1' });
      note(`"${q.slice(0, 50)}" -> ${out.products.length} products ${out.ms}ms`);
      json(res, 200, { products: out.products, ms: out.ms });
    } catch (e) {
      note(`"${q.slice(0, 50)}" -> ERROR ${e.code || ''} ${e.message}`);
      json(res, e.code === 'bad_query' ? 400 : 502, { error: e.message, code: e.code });
    }
    return true;
  }
  if (route === 'POST /api/checkout') {
    const body = await readJson(req);
    if (!Array.isArray(body.items) || !body.items.length) { json(res, 400, { error: 'items required' }); return true; }
    const out = await shopCheckout(body.items);
    // Never log continue_url: it carries the checkout's access key (checkout.md).
    note(`${body.items.length} items -> ${out.checkouts.length} checkouts (${out.checkouts.map(c => c.store).join(', ')}), ${out.failed.length} failed, ${out.ms}ms`);
    json(res, 200, out);
    return true;
  }
  return false;
}

export const shopSession = session; // for /api/health or debugging
