// /api/decal (Nano Banana image), /api/token (ephemeral live-transcribe token), /api/verify (Decisions API).
import { BASE, KEY, generateContent, postJson, scrub, withRetry } from './lib.mjs';

// ---------- decal ----------
export const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gemini-nano-banana-2.1';
const RATIOS = ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'];
export function closestRatio(w, h) {
  const target = Math.log((+w > 0 ? +w : 1) / (+h > 0 ? +h : 1));
  let best = '1:1', bd = Infinity;
  for (const r of RATIOS) { const [a, b] = r.split(':').map(Number); const d = Math.abs(Math.log(a / b) - target); if (d < bd) { bd = d; best = r; } }
  return best;
}

async function genImage(prompt, aspectRatio) {
  const js = await generateContent(IMAGE_MODEL, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio, imageSize: '1K' }, thinkingConfig: { thinkingLevel: 'minimal' } },
  }, { timeoutMs: 90000 });
  const cand = js.candidates?.[0];
  const img = (cand?.content?.parts || []).find(p => p.inlineData?.data || p.inline_data?.data);
  if (img) { const d = img.inlineData || img.inline_data; return { dataUrl: `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}` }; }
  const why = cand?.finishReason || js.promptFeedback?.blockReason || 'no image returned';
  const txt = (cand?.content?.parts || []).map(p => p.text).filter(Boolean).join(' ').slice(0, 200);
  return { refused: `${why}${txt ? ': ' + txt : ''}` };
}

export async function decal({ prompt, width, height }) {
  if (typeof prompt !== 'string' || !prompt.trim()) { const e = new Error('prompt required'); e.status = 400; throw e; }
  const t0 = Date.now();
  const ar = closestRatio(width, height);
  const framing = ' The image is a flat, front-on picture that fills the entire frame edge to edge (the background color reaches all four edges and corners): no wall, no room, no frame mockup, no perspective.';
  let r = await genImage(prompt.trim() + framing, ar);
  if (r.refused) {
    console.log(`[decal] first attempt refused (${r.refused.slice(0, 120)}); retrying softened`);
    const soft = `An original emblem/artwork in the style of the following, not a reproduction of any trademarked logo or copyrighted work, no brand names or lettering: ${prompt.trim()}.` + framing;
    r = await genImage(soft, ar);
  }
  if (r.refused) { const e = new Error('image model refused: ' + r.refused); e.status = 422; throw e; }
  return { dataUrl: r.dataUrl, ms: Date.now() - t0, model: IMAGE_MODEL, aspectRatio: ar };
}

// ---------- ephemeral token for gemini-3.5-transcribe-live ----------
export const LIVE_MODEL = process.env.LIVE_MODEL || 'gemini-3.5-transcribe-live';
export const LIVE_API_VERSION = 'v1alpha';
export const TRANSCRIBE_CONFIG = { responseModalities: ['TEXT'], inputAudioTranscription: { languageCodes: ['en-US'] } };
let genaiMod = null;
async function genai() { return genaiMod ||= await import('@google/genai'); }

export async function token() {
  const { GoogleGenAI } = await genai();
  const ai = new GoogleGenAI({ apiKey: KEY, httpOptions: { apiVersion: LIVE_API_VERSION } });
  const now = Date.now();
  const tok = await withRetry(() => ai.authTokens.create({ config: {
    uses: 1,
    expireTime: new Date(now + 30 * 60e3).toISOString(),
    newSessionExpireTime: new Date(now + 5 * 60e3).toISOString(),
    liveConnectConstraints: { model: LIVE_MODEL, config: TRANSCRIBE_CONFIG },
  } }), { label: 'token', priority: 'high' });
  if (!tok?.name) throw new Error('token mint returned no name');
  return { token: tok.name, model: LIVE_MODEL, apiVersion: LIVE_API_VERSION };
}

// ---------- verify via Decisions API ----------
export const DECISION_MODEL = process.env.DECISION_MODEL || 'gemini-decision-1';
export async function verify({ image, claims }) {
  const m = typeof image === 'string' && image.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!m) { const e = new Error('image must be a base64 data URL'); e.status = 400; throw e; }
  if (!Array.isArray(claims) || !claims.length) { const e = new Error('claims required'); e.status = 400; throw e; }
  const questions = {}; const keyMap = {};
  claims.slice(0, 20).forEach((c, i) => {
    const k = String(c.key || `c${i}`).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 60) || `c${i}`;
    keyMap[k] = c.key ?? k;
    questions[k] = { type: 'noul', instructions: `This is a screenshot of a rendered 3D room (interior design app; generated furniture may be stylized, low-poly approximations). Does the rendered room show: ${c.text}?` };
  });
  const t0 = Date.now();
  const js = await postJson(`${BASE}/decisions`, { model: DECISION_MODEL, input: [{ type: 'image', data: m[2], mime_type: m[1] }], questions }, { timeoutMs: 30000 });
  const answers = js.answers || js.createDecisionResponse?.answers || {};
  const results = {};
  for (const [k, orig] of Object.entries(keyMap)) {
    const a = answers[k] || {};
    results[orig] = { yes: typeof a.noul === 'number' ? a.noul : 0.5, confidence: typeof a.confidence === 'number' ? a.confidence : 0 };
  }
  return { results, ms: Date.now() - t0, model: DECISION_MODEL };
}
export { scrub };
