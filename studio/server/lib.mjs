// Shared helpers: API key (never logged), Gemini REST calls, SSE parsing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const BASE = 'https://generativelanguage.googleapis.com/v1beta';

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const envFile = path.join(SERVER_DIR, '..', '..', '.env');
  if (fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, 'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
    if (m) return m[1].trim();
  }
  throw new Error('GEMINI_API_KEY missing (env or ../../.env)');
}
export const KEY = loadKey();
export const H = { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' };

// Never let the key leak into error text.
export const scrub = s => String(s).split(KEY).join('***');

export async function postJson(url, body, { timeoutMs = 120000, signal } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(new Error(`timeout after ${timeoutMs} ms`)), timeoutMs);
  const onAbort = () => ctl.abort(signal.reason);
  signal?.addEventListener('abort', onAbort);
  try {
    const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body), signal: ctl.signal });
    const txt = await r.text();
    let js; try { js = JSON.parse(txt); } catch { js = { raw: txt.slice(0, 500) }; }
    if (!r.ok) {
      const e = new Error(scrub(`${r.status} ${js.error?.message || JSON.stringify(js).slice(0, 400)}`));
      e.status = r.status; throw e;
    }
    return js;
  } finally { clearTimeout(t); signal?.removeEventListener('abort', onAbort); }
}

export async function generateContent(model, body, opts) {
  return postJson(`${BASE}/models/${model}:generateContent`, body, opts);
}

// Parse an SSE response body into JSON objects.
export async function* sse(res) {
  const dec = new TextDecoder(); let buf = '';
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n');
      if (!data || data === '[DONE]') continue;
      try { yield JSON.parse(data); } catch { /* ignore partial/non-JSON */ }
    }
  }
}

export const textOf = js => (js.candidates?.[0]?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
