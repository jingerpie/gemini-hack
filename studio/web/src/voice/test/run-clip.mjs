// Real-service test of the voice core (same GeminiStt/Segmenter classes the browser uses).
// Streams recorded 16 kHz PCM clips in real time to gemini-3.5-transcribe-live through an ephemeral token
// minted here (key read from ../../.env, never printed), and prints each utterance with its delay from the
// true end of the phrase.
//
// Usage (from studio/):  node web/src/voice/test/run-clip.mjs [natural|monologue|quick] [--noise=0.02] [--drop-at=9000]
//                         [--gate=0|1] [--lead=1000] [--quiet]
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, Modality } from "@google/genai";
import { GeminiStt, TUNING, tokenize } from "../stt-core.ts";

const AUDIO_DIR =
  process.env.VOICE_AUDIO_DIR ||
  "C:/Users/rohan/AppData/Local/Temp/claude/C--Users-rohan-Desktop-Work-STUFF-Projects-gemini-hack/cd9c07f4-1fda-4509-9004-3f7692f11165/scratchpad/live_test/audio";
const ENV_FILE = process.env.ENV_FILE || path.resolve(import.meta.dirname, "../../../../../.env");

const args = process.argv.slice(2);
const scenario = args.find((a) => !a.startsWith("--")) || "natural";
const opt = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split("=")[1] : d;
};
const NOISE = +opt("noise", 0);
const DROP_AT = +opt("drop-at", 0);
const LEAD = +opt("lead", 1000);
const QUIET = args.includes("--quiet");
if (opt("gate", "") !== "") TUNING.GATE_AFTER_END = opt("gate", "") === "1";

const TEXT = {
  s0: "Okay, let's start.",
  s1: "Put a red cube in the middle of the room.",
  s2: "Hmm, and also add a tall blue cylinder to the left of it.",
  s3: "Actually, remove the cube.",
  filler:
    "And you know, I keep thinking about how the whole room should feel, sort of cozy and warm, with soft lighting, plenty of space to walk around, and maybe some plants near the window later on, but we can figure that part out as we go.",
};
const SCENARIOS = {
  natural: [["s0", 700], ["s1", 1000], ["s2", 1000], ["s3", 0]],
  monologue: [["s0", 150], ["s1", 150], ["filler", 150], ["s2", 150], ["s3", 0]],
  quick: [["s1", 600], ["s3", 600], ["s1", 0]], // commands with short (600 ms) pauses
};

// ---- build the stream ----
const RATE = 16000;
const parts = [new Int16Array(Math.round((LEAD * RATE) / 1000))];
const schedule = [];
let cursor = LEAD;
for (const [key, gap] of SCENARIOS[scenario]) {
  const buf = fs.readFileSync(path.join(AUDIO_DIR, `${key}.pcm`));
  const pcm = new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + (buf.length & ~1)));
  const d = (pcm.length / RATE) * 1000;
  schedule.push({ key, start: cursor, end: cursor + d });
  parts.push(pcm, new Int16Array(Math.round((gap * RATE) / 1000)));
  cursor += d + gap;
}
const speechEnd = cursor;
parts.push(new Int16Array(RATE * 3));
const total = parts.reduce((n, p) => n + p.length, 0);
const stream = new Int16Array(total);
{
  let o = 0;
  for (const p of parts) (stream.set(p, o), (o += p.length));
}
if (NOISE > 0) {
  // gaussian noise + slow amplitude wobble, a crude stand-in for room noise
  for (let i = 0; i < stream.length; i++) {
    const g = Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(2 * Math.PI * Math.random());
    const wob = 1 + 0.3 * Math.sin((i / RATE) * 2 * Math.PI * 0.7);
    stream[i] = Math.max(-32768, Math.min(32767, stream[i] + g * NOISE * wob * 32768));
  }
}

// ---- token minting (what /api/token does on the server) ----
function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const line = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/).find((l) => /^\s*GEMINI_API_KEY\s*=/.test(l));
  if (!line) throw new Error("GEMINI_API_KEY not found");
  return line.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
}
const KEY = loadKey();
const MODEL = "gemini-3.5-transcribe-live";
let tokens = 0;
async function getToken() {
  const ai = new GoogleGenAI({ apiKey: KEY, httpOptions: { apiVersion: "v1alpha" } });
  const now = Date.now();
  const tok = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + 30 * 60e3).toISOString(),
      newSessionExpireTime: new Date(now + 60e3).toISOString(),
      liveConnectConstraints: {
        model: MODEL,
        config: { responseModalities: [Modality.TEXT], inputAudioTranscription: { languageCodes: ["en-US"] } },
      },
    },
  });
  tokens++;
  return { token: tok.name, model: MODEL, apiVersion: "v1alpha" };
}

// ---- run ----
let t0 = 0;
const T = () => Math.round(performance.now() - t0);
const where = (t) => {
  const s = schedule.find((s) => t >= s.start && t < s.end);
  return s ? `in ${s.key}` : t < speechEnd ? "gap" : "after";
};
const utts = [];
let lastInterim = "";
const origWarn = console.warn;
console.warn = (...a) => (String(a[0]).includes("experimental") ? undefined : origWarn(...a));

const stt = new GeminiStt({
  getToken,
  onInterim: (t) => {
    lastInterim = t;
    if (!QUIET) console.log(`[${String(T()).padStart(6)} ${where(T()).padEnd(9)}] interim  ${JSON.stringify(t)}`);
  },
  onUtterance: (text, info) => {
    const t = T();
    // the phrase that most recently ended before this commit
    const ended = schedule.filter((s) => s.end <= t).at(-1);
    const delay = ended ? Math.round(t - ended.end) : null;
    utts.push({ t, text, reason: info.reason, after: ended?.key, delay });
    console.log(
      `[${String(t).padStart(6)} ${where(t).padEnd(9)}] UTTERANCE (${info.reason}) +${delay}ms after end of ${ended?.key}: ${JSON.stringify(text)}`,
    );
  },
  onStatus: (s, d) => console.log(`[${String(T()).padStart(6)}] status ${s} ${d ?? ""}`),
  onFatal: (e) => console.log(`[${String(T()).padStart(6)}] FATAL ${e.message}`),
  log: (m) => {
    if (!QUIET || /final|down|rotat|reconnect|dropped/.test(m)) console.log(`[${String(T()).padStart(6)} ${where(T()).padEnd(9)}] .. ${m}`);
  },
});

const tc = performance.now();
await stt.start();
console.log(`connected in ${Math.round(performance.now() - tc)} ms; scenario ${scenario}, noise ${NOISE}, gate ${TUNING.GATE_AFTER_END}`);
console.log("schedule:", schedule.map((s) => `${s.key} ${Math.round(s.start)}-${Math.round(s.end)}`).join(" | "));
t0 = performance.now();
const CH = 640; // 40 ms
let dropped = false;
for (let i = 0; i * CH < stream.length; i++) {
  if (DROP_AT && !dropped && i * 40 >= DROP_AT) {
    dropped = true;
    console.log(`[${T()}] >>> simulating network drop`);
    stt.debugDrop();
  }
  stt.pushAudio(stream.subarray(i * CH, (i + 1) * CH));
  const wait = t0 + (i + 1) * 40 - performance.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
await new Promise((r) => setTimeout(r, 1500));
stt.stop(true);

// ---- word-level check against the reference text ----
const ref = schedule.flatMap((s) => tokenize(TEXT[s.key]).map((t) => t.norm));
const hyp = utts.flatMap((u) => tokenize(u.text).map((t) => t.norm));
const n = ref.length, m = hyp.length;
const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = ref[i] === hyp[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
const missing = [], extra = [];
for (let i = 0, j = 0; i < n || j < m; ) {
  if (i < n && j < m && ref[i] === hyp[j]) (i++, j++);
  else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) extra.push(hyp[j++]);
  else missing.push(ref[i++]);
}
console.log(`\n===== SUMMARY ${scenario} (noise ${NOISE}, gate ${TUNING.GATE_AFTER_END}, tokens minted ${tokens}) =====`);
for (const u of utts) console.log(`  ${String(u.t).padStart(6)}ms  ${u.reason.padEnd(12)} +${String(u.delay).padStart(5)}ms after ${u.after}  ${u.text}`);
console.log(`  words: ref ${n}, hyp ${m}, matched ${L[0][0]}`);
console.log(`  missing vs reference: ${missing.length ? missing.join(" ") : "(none)"}`);
console.log(`  extra (dupes/misrecognitions): ${extra.length ? extra.join(" ") : "(none)"}`);
const dupCheck = utts.map((u) => u.text).join(" | ");
console.log(`  joined: ${dupCheck}`);
process.exit(0);
