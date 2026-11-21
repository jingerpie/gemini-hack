// POST /api/source: a Managed Agent finds 3 real products matching a custom object (google_search + opening pages
// in its sandbox), writes /workspace/products.json; we take it from the write_to_file call and cancel the rest.
// Fallback (agent failure/timeout, or hedge after SOURCE_HEDGE_MS): direct gemini-4-hydrogen + google_search,
// with vertexaisearch grounding-redirect URLs resolved server-side.
// Also GET /api/img?u=<url>: SSRF-safe image proxy for hot-link-blocked product photos.
import dns from 'node:dns/promises';
import net from 'node:net';
import { BASE, H, sse, scrub, generateContent, textOf } from './lib.mjs';

export const SOURCE_AGENT = process.env.SOURCE_AGENT || 'antigravity-preview-09-2026';
export const SOURCE_DIRECT_MODEL = process.env.SOURCE_DIRECT_MODEL || 'gemini-4-hydrogen';
const AGENT_TIMEOUT_MS = +(process.env.SOURCE_AGENT_TIMEOUT_MS || 150000);
const HEDGE_MS = +(process.env.SOURCE_HEDGE_MS || 90000);
const DIRECT_TIMEOUT_MS = +(process.env.SOURCE_DIRECT_TIMEOUT_MS || 100000);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const agentPrompt = desc => `Find exactly 3 real products currently for sale online that match this furniture description: "${desc}". Rules: use google_search to find candidates, then OPEN EACH PRODUCT PAGE (url_context, or curl/python from the sandbox) and confirm it loads, is a single product page (not a category/search page), and matches the description. Take the price and the main product image URL (og:image) from the page itself. Discard any candidate you could not open and replace it. Prefer stores that serve pages to bots (e.g. Etsy, Wayfair, Overstock, Article, West Elm, Target, Walmart, Amazon may block). Write a JSON array to /workspace/products.json with objects {"title","price","store","url","image_url"}. Reply "done" when the file is written.`;

const directPrompt = desc => `Use Google Search to find exactly 3 real products currently for sale online that match this furniture description: "${desc}".
Return ONLY a JSON array (no prose, no markdown fence) of objects {"title","price","store","url","image_url"} where url is the product page and image_url is a direct link to the product image.`;

// ---------- parsing ----------
const isHttp = u => typeof u === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(u.trim());
export function parseProducts(text) {
  let s = String(text || '').replace(/```(?:json)?/gi, '').trim();
  let arr = null;
  try { arr = JSON.parse(s); } catch {
    const m = s.match(/\[[\s\S]*\]/); if (m) { try { arr = JSON.parse(m[0]); } catch { } }
  }
  if (arr && !Array.isArray(arr)) arr = arr.products || arr.items || Object.values(arr).find(Array.isArray) || null;
  if (!Array.isArray(arr)) return [];
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  return arr.filter(p => p && isHttp(p.url)).slice(0, 3).map(p => ({
    title: String(p.title || p.name || 'Product').slice(0, 200),
    price: String(p.price ?? '').slice(0, 40),
    store: String(p.store || host(p.url)).slice(0, 80),
    url: p.url.trim(),
    image_url: isHttp(p.image_url) ? p.image_url.trim().replace(/^http:\/\//i, 'https://') : '',
  }));
}

// ---------- status text from agent steps ----------
const hostsIn = s => [...new Set((String(s).match(/https?:\/\/[^\s"'\\)]+/g) || []).map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } }).filter(Boolean))];
function stepStatus(step) {
  const a = step.arguments || {};
  switch (step.type) {
    case 'google_search_call': {
      const q = a.queries || a.query || a.search_queries;
      return `searching the web${q ? ': ' + (Array.isArray(q) ? q[0] : q) : ''}`;
    }
    case 'url_context_call': { const h = hostsIn(JSON.stringify(a)); return `opening product page${h.length ? ': ' + h.slice(0, 2).join(', ') : ''}`; }
    case 'code_execution_call': {
      const code = String(a.code || ''); const h = hostsIn(code);
      if (/products\.json/.test(code) && !h.length) return 'double-checking the product list';
      if (h.length) return `opening product page: ${h.slice(0, 2).join(', ')}`;
      return /price|og:image/i.test(code) ? 'checking prices and photos' : 'checking product pages';
    }
    case 'function_call': return step.name === 'write_to_file' ? 'writing the product list' : `agent tool: ${step.name}`;
    default: return null;
  }
}

function cancelInteraction(id) {
  if (!id) return Promise.resolve();
  return fetch(`${BASE}/interactions/${id}/cancel`, { method: 'POST', headers: H }).then(r => r.text()).catch(() => {});
}

// ---------- agent path ----------
async function agentSource(req, { signal, onStatus, onInteraction }) {
  const t0 = Date.now();
  let interactionId = null, finalText = '', status = null;
  const res = await fetch(`${BASE}/interactions`, { method: 'POST', headers: H, signal,
    body: JSON.stringify({ agent: SOURCE_AGENT, input: agentPrompt(req.description || req.name), environment: 'remote', stream: true }) });
  if (!res.ok) throw new Error(scrub(`agent HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`));
  const steps = {};
  for await (const ev of sse(res)) {
    const et = ev.event_type;
    if (et === 'interaction.created') { interactionId = ev.interaction?.id; onInteraction?.(interactionId); onStatus('shopping agent started'); }
    else if (et === 'step.start') {
      const s = steps[ev.index] = { ...ev.step, _args: '' };
      if (s.arguments || s.type !== 'function_call' || s.name === 'write_to_file') { const t = stepStatus(s); if (t) onStatus(t); }
      if (s.type === 'code_execution_result' && s.is_error) onStatus('a page could not be opened, trying another');
    } else if (et === 'step.delta') {
      const s = steps[ev.index], d = ev.delta || {}; if (!s) continue;
      if (d.type === 'arguments_delta') s._args += d.arguments;
      if (d.type === 'text') finalText += d.text;
      if (d.type === 'thought_summary' && !s._h) { const h = (d.content?.text || d.text || '').match(/\*\*([^*]{3,80})\*\*/); if (h) { s._h = 1; onStatus(h[1].trim()); } }
    } else if (et === 'step.stop') {
      const s = steps[ev.index]; if (!s) continue;
      if (s._args) { try { s.arguments = JSON.parse(s._args); } catch { } }
      if (s.type === 'function_call' && s.name !== 'write_to_file' && s._args) { const t = stepStatus(s); if (t) onStatus(t); }
      if (s.type === 'function_call' && s.name === 'write_to_file' && /products\.json$/.test(String(s.arguments?.TargetFile || ''))) {
        const products = parseProducts(s.arguments?.CodeContent);
        if (products.length) {
          onStatus(`found ${products.length} products`);
          cancelInteraction(interactionId); // no need to wait for the agent's wrap-up
          return { products, ms: Date.now() - t0, model: SOURCE_AGENT };
        }
        onStatus('product file was empty/invalid, agent continuing');
      }
    } else if (et === 'interaction.completed') status = ev.interaction?.status;
    else if (et === 'error') throw new Error('agent stream error: ' + scrub(JSON.stringify(ev.error || ev).slice(0, 300)));
  }
  const fromText = parseProducts(finalText);
  if (fromText.length) return { products: fromText, ms: Date.now() - t0, model: SOURCE_AGENT };
  throw new Error(`agent finished (${status || 'stream ended'}) without products`);
}

// ---------- direct fallback ----------
async function resolveRedirect(u, signal) {
  if (!/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect/.test(u)) return u;
  let cur = u;
  for (let i = 0; i < 5; i++) {
    const r = await fetch(cur, { redirect: 'manual', headers: { 'User-Agent': UA }, signal: AbortSignal.any([signal, AbortSignal.timeout(8000)].filter(Boolean)) });
    const loc = r.headers.get('location');
    r.body?.cancel?.().catch(() => {});
    if (!loc || r.status < 300 || r.status >= 400) return cur;
    cur = new URL(loc, cur).href;
    if (!/vertexaisearch\.cloud\.google\.com/.test(cur)) return cur;
  }
  return cur;
}

async function directSource(req, { signal, onStatus }) {
  const t0 = Date.now();
  onStatus(`fallback: ${SOURCE_DIRECT_MODEL} searching with Google Search`);
  const js = await generateContent(SOURCE_DIRECT_MODEL, {
    contents: [{ role: 'user', parts: [{ text: directPrompt(req.description || req.name) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { thinkingConfig: { thinkingLevel: 'low' } },
  }, { timeoutMs: DIRECT_TIMEOUT_MS, signal });
  let products = parseProducts(textOf(js));
  if (!products.length) throw new Error('direct search returned no parseable products');
  onStatus('resolving store links');
  products = (await Promise.all(products.map(async p => {
    try { const url = await resolveRedirect(p.url, signal); return /vertexaisearch/.test(url) ? null : { ...p, url }; }
    catch { return null; }
  }))).filter(Boolean);
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  products = products.map(p => ({ ...p, store: p.store || host(p.url) }));
  if (!products.length) throw new Error('could not resolve any product links');
  return { products, ms: Date.now() - t0, model: SOURCE_DIRECT_MODEL };
}

// ---------- orchestration ----------
// mode: 'race' (agent, hedged by direct after HEDGE_MS), 'agent', 'direct'
export function sourceProducts(req, { send, mode = 'race', signal: outer }) {
  const t0 = Date.now();
  const status = (() => { let last = Date.now(); const f = text => { last = Date.now(); send({ type: 'status', text: String(text).slice(0, 160) }); }; f.last = () => last; return f; })();
  return new Promise(resolve => {
    let done = false, pending = 0, directStarted = false, interaction = null;
    const agentCtl = new AbortController(), directCtl = new AbortController(), timers = [], errors = [];
    const hb = setInterval(() => { if (Date.now() - status.last() > 5000) status(`still shopping (${Math.round((Date.now() - t0) / 1000)}s)`); }, 1000);
    const finish = ev => {
      if (done) return; done = true;
      clearInterval(hb); timers.forEach(clearTimeout);
      agentCtl.abort(new Error('superseded')); directCtl.abort(new Error('superseded'));
      if (!(ev?.type === 'done' && ev.model === SOURCE_AGENT)) cancelInteraction(interaction);
      if (ev) send(ev);
      resolve(ev);
    };
    outer?.addEventListener('abort', () => finish(null));
    const settle = (label, p) => {
      pending++;
      p.then(r => finish({ type: 'done', products: r.products, ms: Date.now() - t0, model: r.model }))
        .catch(e => { if (done) return; const m = scrub(String(e?.message || e)).slice(0, 300); errors.push(`${label}: ${m}`); status(`${label} failed: ${m.slice(0, 100)}`); })
        .finally(() => {
          pending--; if (done) return;
          if (label === 'agent' && mode === 'race' && !directStarted) return startDirect('agent failed');
          if (pending === 0) finish({ type: 'error', message: errors.join(' | ') || 'sourcing failed' });
        });
    };
    const startDirect = why => {
      if (done || directStarted || mode === 'agent') return;
      directStarted = true; if (why) status(`starting fallback search (${why})`);
      settle('direct', directSource(req, { signal: directCtl.signal, onStatus: status }));
    };
    if (mode === 'direct') startDirect();
    else {
      settle('agent', agentSource(req, { signal: agentCtl.signal, onStatus: status, onInteraction: id => { interaction = id; } }));
      timers.push(setTimeout(() => { if (!done) { status(`shopping agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`); agentCtl.abort(new Error('agent timeout')); cancelInteraction(interaction); } }, AGENT_TIMEOUT_MS));
      if (mode === 'race') timers.push(setTimeout(() => startDirect(`agent still working after ${HEDGE_MS / 1000}s, hedging`), HEDGE_MS));
    }
    timers.push(setTimeout(() => finish({ type: 'error', message: `sourcing timed out; ${errors.join(' | ')}` }), AGENT_TIMEOUT_MS + DIRECT_TIMEOUT_MS + 5000));
  });
}

// ---------- image proxy ----------
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const s = ip.toLowerCase();
  if (s === '::' || s === '::1') return true;
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); if (mapped) return isPrivateIp(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s) || s.startsWith('64:ff9b:') || s.startsWith('2002:');
}
async function assertPublic(u) {
  const url = new URL(u);
  if (!/^https?:$/.test(url.protocol)) throw Object.assign(new Error('only http/https allowed'), { status: 400 });
  if (url.username || url.password) throw Object.assign(new Error('credentials in URL not allowed'), { status: 400 });
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(host)) throw Object.assign(new Error('host not allowed'), { status: 403 });
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true, verbatim: true });
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw Object.assign(new Error('private/loopback address not allowed'), { status: 403 });
  return url;
}

const IMG_MAX = 5 * 1024 * 1024;
export async function proxyImage(rawUrl) {
  if (!rawUrl) throw Object.assign(new Error('missing u'), { status: 400 });
  let cur;
  try { cur = new URL(rawUrl).href; } catch { throw Object.assign(new Error('invalid url'), { status: 400 }); }
  const deadline = AbortSignal.timeout(10000);
  for (let hop = 0; hop < 5; hop++) {
    const url = await assertPublic(cur);
    const r = await fetch(url, { redirect: 'manual', signal: deadline, headers: {
      'User-Agent': UA, Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8', Referer: url.origin + '/' } });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { r.body?.cancel?.().catch(() => {}); cur = new URL(r.headers.get('location'), url).href; continue; }
    if (!r.ok) { r.body?.cancel?.().catch(() => {}); throw Object.assign(new Error(`upstream ${r.status}`), { status: 502 }); }
    const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!type.startsWith('image/')) { r.body?.cancel?.().catch(() => {}); throw Object.assign(new Error(`not an image (${type || 'no content-type'})`), { status: 415 }); }
    if (+r.headers.get('content-length') > IMG_MAX) { r.body?.cancel?.().catch(() => {}); throw Object.assign(new Error('image too large'), { status: 413 }); }
    const chunks = []; let n = 0;
    for await (const c of r.body) { n += c.length; if (n > IMG_MAX) throw Object.assign(new Error('image too large'), { status: 413 }); chunks.push(c); }
    return { type, body: Buffer.concat(chunks) };
  }
  throw Object.assign(new Error('too many redirects'), { status: 502 });
}
