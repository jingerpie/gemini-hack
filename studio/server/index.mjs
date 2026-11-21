// Studio backend. Plain node:http. Run: node server/index.mjs   (PORT env, default 8787)
import http from 'node:http';
import { scrub } from './lib.mjs';
import { patch, PATCH_MODEL } from './patch.mjs';
import { buildAsset, assetConfig } from './asset.mjs';
import { decal, token, verify, IMAGE_MODEL, LIVE_MODEL, DECISION_MODEL } from './media.mjs';

const PORT = +(process.env.PORT || 8787);
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

async function readJson(req, limit = 25 * 1024 * 1024) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) { const e = new Error('body too large'); e.status = 413; throw e; } chunks.push(c); }
  if (!n) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const e = new Error('invalid JSON body'); e.status = 400; throw e; }
}
function json(res, status, obj) {
  if (res.headersSent) return;
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

async function handle(req, res, url, note) {
  const route = `${req.method} ${url.pathname}`;
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (route === 'GET /api/health') return json(res, 200, { ok: true, models: { patch: PATCH_MODEL, asset: assetConfig, image: IMAGE_MODEL, live: LIVE_MODEL, decision: DECISION_MODEL } });

  if (route === 'POST /api/patch') {
    const body = await readJson(req);
    const out = await patch(body);
    note(`"${String(body.utterance).slice(0, 60)}" -> ${out.ops.length} ops, ${out.jobs.length} jobs, model ${out.ms}ms${out._dropped.length ? ', dropped: ' + out._dropped.join('; ') : ''}`);
    const { _dropped, ...resp } = out;
    if (_dropped.length) resp.dropped = _dropped;
    return json(res, 200, resp);
  }

  if (route === 'POST /api/asset') {
    const body = await readJson(req);
    if (!body.description && !body.name) return json(res, 400, { error: 'description required' });
    const mode = ['direct', 'agent', 'race'].includes(url.searchParams.get('via')) ? url.searchParams.get('via') : 'race';
    res.writeHead(200, { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders?.();
    const ctl = new AbortController();
    res.on('close', () => { if (!res.writableFinished) ctl.abort(new Error('client disconnected')); });
    const ping = setInterval(() => res.write(': ping\n\n'), 10000);
    const send = ev => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(ev)}\n\n`); };
    let last = null;
    const agentModel = /^gemini-[\w.-]+$/.test(url.searchParams.get('agentModel') || '') ? url.searchParams.get('agentModel') : undefined;
    try { last = await buildAsset(body, { send: ev => { last = ev; send(ev); }, mode, signal: ctl.signal, agentModel }); }
    catch (e) { send({ type: 'error', message: scrub(e.message || e) }); last = { type: 'error' }; }
    finally { clearInterval(ping); res.end(); }
    note(`${body.objectId || ''} "${String(body.name || '').slice(0, 40)}" mode=${mode} -> ${last ? (last.type === 'done' ? `done via ${last.via} (${last.ms}ms, ${last.code.length} chars)` : `${last.type}${last.message ? ': ' + last.message.slice(0, 200) : ''}`) : 'aborted by client'}`);
    return;
  }

  if (route === 'POST /api/decal') {
    const body = await readJson(req);
    const out = await decal(body);
    note(`${body.decalId || ''} ${out.aspectRatio} ${Math.round(out.dataUrl.length / 1024)}KB`);
    return json(res, 200, out);
  }

  if (route === 'GET /api/token') return json(res, 200, await token());

  if (route === 'POST /api/verify') {
    const body = await readJson(req);
    const out = await verify(body);
    note(Object.entries(out.results).map(([k, v]) => `${k}=${v.yes.toFixed(2)}`).join(' '));
    return json(res, 200, out);
  }

  return json(res, 404, { error: `no route ${route}` });
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now(); let extra = '';
  const url = new URL(req.url, 'http://x');
  try { await handle(req, res, url, s => { extra = s; }); }
  catch (e) {
    const status = e.status >= 400 && e.status < 600 ? e.status : 500;
    extra = 'ERROR ' + scrub(e.message || e).slice(0, 300);
    json(res, status, { error: scrub(e.message || e) });
  }
  if (req.method !== 'OPTIONS') console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - t0}ms ${extra}`);
});
server.requestTimeout = 0; // SSE asset streams can run > 5 min worst case
server.listen(PORT, () => console.log(`studio server on http://localhost:${PORT} (patch=${PATCH_MODEL}, agent=${assetConfig.AGENT}, three=${assetConfig.threeLoaded})`));
