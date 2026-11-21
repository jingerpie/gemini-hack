// Voice core: energy VAD + utterance segmentation + Gemini Live transcription link.
// NO DOM APIs in this file: it is shared by the browser wrapper (voice.ts) and the Node test (test/run-clip.mjs,
// run with Node 24 type stripping). Keep it to erasable TypeScript only (no enums / namespaces / parameter properties)
// and do not add relative imports here (Node needs explicit .ts extensions, tsc forbids them).
import { GoogleGenAI, Modality } from "@google/genai";
import type { LiveServerMessage, Session } from "@google/genai";
import type { TokenResponse } from "../types";

// ----------------------------------------------------------------------------------------------------------------
// Tunables. Times in ms, levels are linear RMS of 16-bit PCM normalised to 0..1.
// ----------------------------------------------------------------------------------------------------------------
export const SAMPLE_RATE = 16000;
export const FRAME_SAMPLES = 320; // 20 ms analysis frame
export const FRAME_MS = 20;

export const TUNING = {
  // --- energy VAD (adaptive noise floor) ---
  VAD_MIN_RMS: 0.008, // absolute minimum speech threshold (~ -42 dBFS); quiet rooms never go below this
  VAD_RATIO_ON: 3.2, // speech starts when smoothed RMS > noiseFloor * this (~ +10 dB over the room)
  VAD_RATIO_OFF: 2.0, // speech continues while smoothed RMS > noiseFloor * this (hysteresis)
  VAD_ONSET_MS: 60, // consecutive loud audio needed to declare speech start (ignores clicks)
  VAD_FLOOR_WINDOW_MS: 1500, // noise floor = minimum smoothed RMS over this sliding window (min-statistics)
  VAD_FLOOR_RISE: 0.05, // per-frame smoothing when the floor rises (~0.4 s time constant)
  VAD_FLOOR_FALL: 0.3, // per-frame smoothing when the floor falls
  END_SILENCE_MS: 450, // silence after speech that ends an utterance
  // --- commit timing ---
  SETTLE_CAP_MS: 900, // after end-of-speech, wait at most this long for the transcript before committing anyway
  PUNCT_EARLY_LAG_MS: 150, // commit without waiting for the final if the newest interim ends in . ? ! and arrived
  //                          at least this long after the last voiced frame
  INCOMPLETE_HOLD_MS: 1500, // text ending in "," / "and" / "the" / filler-only waits for more speech up to this
  //                          much silence (measured from the last voiced frame) before it is committed anyway
  SETTLE_QUIET_MS: 250, // (no-final mode) commit once the interim text has not changed for this long...
  TRANSCRIPT_LAG_MS: 700, // ...and an interim newer than speechEnd + this has arrived
  LONG_RUN_MS: 12000, // continuous speech this long -> commit at the latest sentence boundary
  LONG_RUN_HARD_MS: 20000, // ...after this long also accept a comma boundary / force a cut
  SMALL_LATE_WORDS: 3, // a late server final adding fewer words than this right after a commit is held as carry
  // --- hybrid VAD: audioStreamEnd after end of speech so the server finalises the turn quickly ---
  STREAM_END_DELAY_MS: 300, // after our end-of-speech; skipped if the speaker resumed by then
  // Stop sending audio after audioStreamEnd and resume with pre-roll on the next speech onset. Off by default:
  // streaming continuously lets the server's own VAD catch speech our energy VAD misses in a noisy room.
  GATE_AFTER_END: false,
  PREROLL_MS: 400,
  // --- session ---
  PROACTIVE_RECONNECT_MS: 8 * 60_000, // swap to a fresh session during silence once the current one is this old
  RECONNECT_IDLE_MS: 700, // "silence" needed before a proactive swap
  QUEUE_MAX_MS: 6000, // audio kept while (re)connecting, replayed on open
  CONNECT_TIMEOUT_MS: 9000,
  TOKEN_TIMEOUT_MS: 6000,
  SEND_BATCH_FRAMES: 2, // 40 ms websocket chunks
};

export const LIVE_MODEL = "gemini-3.5-transcribe-live";

// Hesitations are stripped from the edges of an utterance; an utterance made only of FILLER_ONLY words is dropped.
const HESITATIONS = new Set(["um", "umm", "uh", "uhh", "uhm", "er", "erm", "ah", "ahh", "hmm", "hm", "mm", "mmm", "mhm"]);
const FILLER_ONLY = new Set([
  ...HESITATIONS,
  "okay", "ok", "oh", "so", "yeah", "yes", "yep", "right", "alright", "well", "like", "and", "but", "hey", "hi", "now", "then", "the", "a",
]);

// Last words that mean the speaker is mid-sentence (so a pause is a breath, not the end of a command).
const CONTINUATIONS = new Set([
  ...HESITATIONS,
  "and", "or", "but", "so", "because", "then", "also", "plus", "the", "a", "an", "to", "of", "with", "in", "on", "at",
  "for", "from", "into", "onto", "by", "near", "next", "behind", "above", "below", "under", "over", "between", "like",
  "my", "your", "its", "their", "our", "this", "these", "those", "some", "is", "are", "was", "be", "it's", "its",
  "very", "really", "more", "than", "just", "maybe", "actually", "please", "lets", "let", "make", "put", "add",
  "paint", "place", "move", "turn", "change", "i", "we", "want", "need", "would", "could", "can", "should",
]);

// ----------------------------------------------------------------------------------------------------------------
// Tokens
// ----------------------------------------------------------------------------------------------------------------
type Tok = { raw: string; norm: string };

export function tokenize(text: string): Tok[] {
  // The server concatenates segments without a space ("cube.Move the beaker", "andAlsoAdd") -> split them.
  const spaced = text.replace(/([.?!,;:])(?=[A-Za-z])/g, "$1 ").replace(/([a-z])([A-Z])(?=[a-z])/g, (_m, a: string, b: string) => `${a} ${b.toLowerCase()}`);
  const out: Tok[] = [];
  for (const raw of spaced.split(/\s+/)) {
    if (!raw) continue;
    const norm = raw.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    if (!norm) {
      const last = out[out.length - 1];
      if (last) out[out.length - 1] = { raw: last.raw + raw, norm: last.norm };
      continue;
    }
    out.push({ raw, norm });
  }
  return out;
}

const joinToks = (t: Tok[]) => t.map((x) => x.raw).join(" ");

function looksIncomplete(toks: Tok[]): boolean {
  if (!toks.length) return false;
  const last = toks[toks.length - 1];
  if (/[,;:\-–—]$/.test(last.raw)) return true;
  if (/[.?!]["')\]]*$/.test(last.raw)) return false;
  return CONTINUATIONS.has(last.norm) || toks.every((t) => FILLER_ONLY.has(t.norm));
}

// ----------------------------------------------------------------------------------------------------------------
// Energy VAD with min-statistics noise floor
// ----------------------------------------------------------------------------------------------------------------
export class Vad {
  floor = -1;
  smooth = 0;
  inSpeech = false;
  lastVoicedAt = 0;
  speechStartAt = 0;
  private onsetRun = 0;
  private ring: Float32Array;
  private ri = 0;
  private filled = 0;

  constructor() {
    this.ring = new Float32Array(Math.max(1, Math.round(TUNING.VAD_FLOOR_WINDOW_MS / FRAME_MS)));
  }

  get thresholdOn() {
    return Math.max(TUNING.VAD_MIN_RMS, this.floor * TUNING.VAD_RATIO_ON);
  }

  /** Feed one 20 ms frame RMS. Returns "start" / "end" on transitions. */
  update(rms: number, now: number): "start" | "end" | null {
    this.smooth = this.smooth === 0 ? rms : this.smooth * 0.5 + rms * 0.5;
    this.ring[this.ri] = this.smooth;
    this.ri = (this.ri + 1) % this.ring.length;
    this.filled = Math.min(this.filled + 1, this.ring.length);
    let min = Infinity;
    for (let i = 0; i < this.filled; i++) if (this.ring[i] < min) min = this.ring[i];
    if (this.floor < 0) this.floor = min;
    else this.floor += (min - this.floor) * (min > this.floor ? TUNING.VAD_FLOOR_RISE : TUNING.VAD_FLOOR_FALL);

    const on = this.thresholdOn;
    const off = Math.max(TUNING.VAD_MIN_RMS * 0.7, this.floor * TUNING.VAD_RATIO_OFF);
    if (!this.inSpeech) {
      this.onsetRun = this.smooth > on ? this.onsetRun + 1 : 0;
      if (this.onsetRun * FRAME_MS >= TUNING.VAD_ONSET_MS) {
        this.inSpeech = true;
        this.speechStartAt = now - this.onsetRun * FRAME_MS;
        this.lastVoicedAt = now;
        this.onsetRun = 0;
        return "start";
      }
      return null;
    }
    if (this.smooth > off) this.lastVoicedAt = now;
    if (now - this.lastVoicedAt >= TUNING.END_SILENCE_MS) {
      this.inSpeech = false;
      return "end";
    }
    return null;
  }
}

// ----------------------------------------------------------------------------------------------------------------
// Segmenter: audio frames + transcript events in -> interim text / utterances out. Pure logic, injectable clock.
// ----------------------------------------------------------------------------------------------------------------
export type CommitReason = "final" | "punct" | "cap" | "quiet" | "hold" | "server-final" | "long-run" | "flush";
export type UtteranceInfo = { reason: CommitReason; speechEndAt: number; at: number };

export type SegmenterEvents = {
  onInterim(text: string): void;
  onUtterance(text: string, info: UtteranceInfo): void;
  onLevel?(rms: number): void; // per 20 ms frame
  sendAudio?(frame: Int16Array): void; // forward audio to the recogniser
  sendStreamEnd?(): void; // hybrid VAD: tell the server the speech segment ended
  log?(msg: string): void;
};

export type SegmenterOptions = {
  now?: () => number;
  /** true when the recogniser emits a final transcript soon after sendStreamEnd (Gemini). */
  expectFinal?: boolean;
  /** stop forwarding audio between utterances (after sendStreamEnd); resume with pre-roll on speech. */
  gate?: boolean;
  /** (expectFinal=false) how far the recogniser's text lags the audio. */
  lagMs?: number;
};

export class Segmenter {
  readonly vad = new Vad();
  private ev: SegmenterEvents;
  private now: () => number;
  private expectFinal: boolean;
  private gateEnabled: boolean;
  private lagMs: number;

  // transcript state
  private turnToks: Tok[] = []; // latest interim of the server's current turn
  private doneNorms: string[] = []; // norms of the current turn's words already committed / moved to carry
  private carry: Tok[] = []; // words of finalised server turns not yet committed
  private lastFinalNorms: string[] = [];
  private lastFinalAt = -1e9;
  private lastInterimAt = 0;
  private lastInterimChangeAt = 0;
  private lastShown = "";

  // segmentation state
  private settling = false; // speech ended, waiting for the transcript to catch up
  private holding = false; // transcript looked mid-sentence; waiting for more speech (bounded by INCOMPLETE_HOLD_MS)
  private settleStart = 0;
  private streamEndDue = 0;
  private speechEndAt = 0;
  private hasSpeech = false; // VAD saw speech since the last commit
  private utterStart = 0; // start of the current uncommitted run of speech
  private lastCommitAt = -1e9;
  private longCheckedLen = -1;

  // gating
  private gated = false;
  private preroll: Int16Array[] = [];
  private frameBuf = new Int16Array(FRAME_SAMPLES);
  private frameLen = 0;

  constructor(ev: SegmenterEvents, opts: SegmenterOptions = {}) {
    this.ev = ev;
    this.now = opts.now ?? (() => performance.now());
    this.expectFinal = opts.expectFinal ?? true;
    this.gateEnabled = opts.gate ?? TUNING.GATE_AFTER_END;
    this.lagMs = opts.lagMs ?? TUNING.TRANSCRIPT_LAG_MS;
  }

  // ---------------- audio ----------------
  pushAudio(samples: Int16Array): void {
    let i = 0;
    while (i < samples.length) {
      const n = Math.min(FRAME_SAMPLES - this.frameLen, samples.length - i);
      this.frameBuf.set(samples.subarray(i, i + n), this.frameLen);
      this.frameLen += n;
      i += n;
      if (this.frameLen === FRAME_SAMPLES) {
        const frame = this.frameBuf;
        this.frameBuf = new Int16Array(FRAME_SAMPLES);
        this.frameLen = 0;
        this.processFrame(frame);
      }
    }
  }

  private processFrame(frame: Int16Array) {
    const now = this.now();
    let sum = 0;
    for (let k = 0; k < frame.length; k++) sum += frame[k] * frame[k];
    const rms = Math.sqrt(sum / frame.length) / 32768;
    this.ev.onLevel?.(rms);

    const tr = this.vad.update(rms, now);
    if (tr === "start") {
      if (!this.hasSpeech) this.utterStart = this.vad.speechStartAt;
      this.hasSpeech = true;
      if (this.gated) {
        this.gated = false;
        for (const f of this.preroll) this.ev.sendAudio?.(f);
        this.preroll = [];
      }
      this.ev.log?.(`vad start (floor ${this.vad.floor.toFixed(4)} thr ${this.vad.thresholdOn.toFixed(4)})`);
    }

    if (this.gated) {
      this.preroll.push(frame);
      const max = Math.round(TUNING.PREROLL_MS / FRAME_MS);
      if (this.preroll.length > max) this.preroll.splice(0, this.preroll.length - max);
    } else {
      this.ev.sendAudio?.(frame);
    }

    if (tr === "end") {
      this.ev.log?.(`vad end (silence ${TUNING.END_SILENCE_MS} ms)`);
      if (this.hasSpeech || this.pendingToks().length) {
        if (!this.settling) {
          this.settling = true;
          this.holding = false;
          this.settleStart = now;
          this.speechEndAt = this.vad.lastVoicedAt;
        }
        // audioStreamEnd makes the server finalise the turn, but it also stops interims until that final arrives
        // (measured 250-850 ms). So first give the next interim a short chance to show a finished sentence.
        this.streamEndDue = now + TUNING.STREAM_END_DELAY_MS;
        this.tryPunctEarly(now);
      }
    }
    this.tick(now);
  }

  private fireStreamEnd() {
    this.streamEndDue = 0;
    this.ev.sendStreamEnd?.();
    if (this.gateEnabled && !this.vad.inSpeech) {
      this.gated = true;
      this.preroll = [];
    }
  }

  /** Timers; also driven by every audio frame. Safe to call any time. */
  tick(now = this.now()): void {
    if (this.streamEndDue && now >= this.streamEndDue) {
      if (this.vad.inSpeech) this.streamEndDue = 0; // speaker resumed: do not cut the server's turn mid-word
      else this.fireStreamEnd();
    }
    if (this.settling) {
      if (now - this.settleStart >= TUNING.SETTLE_CAP_MS) this.decide("cap", now);
      else if (
        !this.expectFinal &&
        this.lastInterimAt >= this.speechEndAt + this.lagMs &&
        now - this.lastInterimChangeAt >= TUNING.SETTLE_QUIET_MS
      )
        this.decide("quiet", now);
    }
    if (this.holding && !this.vad.inSpeech && now - this.speechEndAt >= TUNING.INCOMPLETE_HOLD_MS) this.commit("hold", now);
    if (this.vad.inSpeech && this.hasSpeech && now - this.utterStart >= TUNING.LONG_RUN_MS) this.tryLongCommit(now);
  }

  /** The transcript is "done" (final / cap / punctuation): commit, unless it reads like a mid-sentence pause. */
  private decide(reason: CommitReason, now: number) {
    const toks = this.pendingToks();
    if (toks.length && looksIncomplete(toks) && now - this.speechEndAt < TUNING.INCOMPLETE_HOLD_MS) {
      if (!this.holding) this.ev.log?.(`holding incomplete "${joinToks(toks)}" (${reason})`);
      this.settling = false;
      this.holding = true;
      return;
    }
    this.commit(reason, now);
  }

  /** While settling: if the newest interim already ends a sentence and was produced after the speech ended, go. */
  private tryPunctEarly(now: number) {
    if (!this.settling || this.vad.inSpeech || !this.turnToks.length) return;
    const last = this.turnToks[this.turnToks.length - 1].raw;
    if (/[.?!]["')\]]*$/.test(last) && this.lastInterimAt >= this.speechEndAt + TUNING.PUNCT_EARLY_LAG_MS) this.decide("punct", now);
  }

  // ---------------- transcript input ----------------
  onServerMessage(m: LiveServerMessage): void {
    const sc = m.serverContent;
    if (!sc) return;
    if (sc.interimInputTranscription) this.handleInterim(sc.interimInputTranscription.text ?? "");
    if (sc.inputTranscription) this.handleFinal(sc.inputTranscription.text ?? "");
  }

  /** Interim = full text of the recogniser's current turn so far (replaces the previous interim). */
  handleInterim(text: string): void {
    const now = this.now();
    const toks = tokenize(text);
    if (!toks.length) return;
    // A late interim of the turn that was just finalised must not be read as a new turn (would duplicate words).
    if (now - this.lastFinalAt < 2500 && this.isPrefixOfLastFinal(toks)) return;
    const changed = toks.length !== this.turnToks.length || toks.some((t, i) => t.norm !== this.turnToks[i].norm);
    this.turnToks = toks;
    this.lastInterimAt = now;
    if (changed) this.lastInterimChangeAt = now;
    this.show();
    if (changed) this.tryPunctEarly(now);
  }

  /** Final = authoritative full text of the turn that just ended; the next interim starts a new turn. */
  handleFinal(text: string): void {
    const now = this.now();
    const f = tokenize(text);
    this.recoverGaps(f, now);
    const k = this.align(f);
    const rem = f.slice(k);
    // Words we already committed beyond the end of this final belong to the next turn.
    const overflow = this.doneNorms.length > f.length && k >= f.length ? this.doneNorms.slice(f.length) : [];
    this.carry.push(...rem);
    this.turnToks = [];
    this.doneNorms = overflow;
    if (f.length) {
      this.lastFinalNorms = f.map((t) => t.norm);
      this.lastFinalAt = now;
    }
    this.ev.log?.(`final "${text}" -> +${rem.length} words${overflow.length ? `, overflow ${overflow.length}` : ""}`);
    if (this.settling || this.holding) this.decide("final", now);
    else if (this.carry.length) {
      // The server ended a turn on its own (our VAD missed the pause, or the final came late after a commit).
      const recent = now - this.lastCommitAt < 3000;
      const big = this.carry.length >= TUNING.SMALL_LATE_WORDS && !looksIncomplete(this.carry);
      if (big || (!recent && !this.vad.inSpeech && !this.hasSpeech)) this.commit("server-final", now);
    }
    this.show();
  }

  /** The recogniser session was replaced: treat the current interim as final text. */
  rebaseTurn(): void {
    if (this.turnToks.length) this.handleFinal(joinToks(this.turnToks));
    this.lastFinalNorms = [];
  }

  /** Commit everything pending now (e.g. on stop). */
  flush(): void {
    this.commit("flush", this.now());
  }

  /** ms since anything happened (speech, settle, pending text); 0 while busy. */
  idleMs(now = this.now()): number {
    if (this.vad.inSpeech || this.settling || this.holding || this.pendingToks().length) return 0;
    return now - Math.max(this.vad.lastVoicedAt, this.lastCommitAt, this.lastInterimAt);
  }

  get isGated() {
    return this.gated;
  }

  // ---------------- internals ----------------
  private isPrefixOfLastFinal(toks: Tok[]) {
    const lf = this.lastFinalNorms;
    if (!lf.length || toks.length > lf.length) return false;
    return toks.every((t, i) => t.norm === lf[i]);
  }

  /**
   * Index into toks where the not-yet-consumed words start. Matches the tail of what was already consumed, so it
   * survives small revisions of earlier words and a final that also contains an earlier turn (server merged turns).
   */
  private align(toks: Tok[]): number {
    const d = this.doneNorms;
    const n = d.length;
    if (n === 0) return 0;
    const matchAt = (j: number, len: number) => {
      if (j < len || j > toks.length) return false;
      for (let q = 1; q <= len; q++) if (toks[j - q].norm !== d[n - q]) return false;
      return true;
    };
    for (const len of [Math.min(3, n), Math.min(2, n), 1]) {
      let best = -1;
      let bestDist = Infinity;
      for (let j = len; j <= toks.length; j++) {
        if (!matchAt(j, len)) continue;
        const dist = Math.abs(j - n) - (j >= n ? 0.5 : 0); // prefer the closest; ties go forward
        if (dist < bestDist) (bestDist = dist), (best = j);
      }
      // a short (1-word) tail match is only trusted near the expected position
      if (best >= 0 && (len >= 2 || Math.abs(best - n) <= 3)) return best;
    }
    return Math.min(n, toks.length);
  }

  private pendingToks(): Tok[] {
    return [...this.carry, ...this.turnToks.slice(this.align(this.turnToks))];
  }

  private show() {
    const text = joinToks(this.pendingToks());
    if (text !== this.lastShown) {
      this.lastShown = text;
      this.ev.onInterim(text);
    }
  }

  private commit(reason: CommitReason, now: number) {
    const toks = this.pendingToks();
    this.carry = [];
    this.doneNorms = this.turnToks.map((t) => t.norm);
    const speechEndAt = this.settling || this.holding ? this.speechEndAt : this.vad.lastVoicedAt;
    this.settling = false;
    this.holding = false;
    this.hasSpeech = this.vad.inSpeech;
    this.utterStart = this.vad.inSpeech ? now : 0;
    this.longCheckedLen = -1;
    this.lastCommitAt = now;
    if (this.streamEndDue && !this.vad.inSpeech) this.fireStreamEnd(); // sentence is done: let the server close its turn
    this.emit(toks, { reason, speechEndAt, at: now });
    this.show();
  }

  private tryLongCommit(now: number) {
    const toks = this.pendingToks();
    if (toks.length === this.longCheckedLen) return;
    this.longCheckedLen = toks.length;
    const hard = now - this.utterStart >= TUNING.LONG_RUN_HARD_MS;
    let cut = -1;
    // Only cut at a boundary that already has words after it (the recogniser has moved past it, so it is stable).
    for (let i = toks.length - 2; i >= 0 && cut < 0; i--) if (/[.?!]["')\]]*$/.test(toks[i].raw)) cut = i;
    if (cut < 0 && hard) for (let i = toks.length - 2; i >= 0 && cut < 0; i--) if (/[,;:]$/.test(toks[i].raw)) cut = i;
    if (cut < 0 && hard && toks.length > 6) cut = toks.length - 3;
    if (cut < 0) return;
    const take = toks.slice(0, cut + 1);
    if (cut < this.carry.length) this.carry = this.carry.slice(cut + 1);
    else {
      const used = cut + 1 - this.carry.length;
      const k = this.align(this.turnToks);
      this.carry = [];
      this.doneNorms = this.turnToks.slice(0, k + used).map((t) => t.norm);
    }
    this.utterStart = now;
    this.longCheckedLen = -1;
    this.lastCommitAt = now;
    this.emit(take, { reason: "long-run", speechEndAt: now, at: now });
    this.show();
  }

  private emit(toks: Tok[], info: UtteranceInfo) {
    const t = toks.slice();
    while (t.length && HESITATIONS.has(t[0].norm)) t.shift();
    while (t.length && HESITATIONS.has(t[t.length - 1].norm)) t.pop();
    if (!t.length || t.every((x) => FILLER_ONLY.has(x.norm))) {
      if (toks.length) this.ev.log?.(`dropped filler "${joinToks(toks)}" (${info.reason})`);
      return;
    }
    // "Actually," + "Remove the cube?" -> "Actually, remove the cube?" (a turn break mid-sentence capitalises)
    for (let i = 1; i < t.length; i++)
      if (!/[.?!]["')\]]*$/.test(t[i - 1].raw) && /^[A-Z][a-z]/.test(t[i].raw) && t[i].norm !== "i")
        t[i] = { raw: t[i].raw[0].toLowerCase() + t[i].raw.slice(1), norm: t[i].norm };
    let text = joinToks(t).replace(/^[\s,;:.!?-]+/, "").trim();
    if (!text) return;
    text = text[0].toUpperCase() + text.slice(1);
    this.ev.onUtterance(text, info);
  }
}

// ----------------------------------------------------------------------------------------------------------------
// GeminiStt: Segmenter + gemini-3.5-transcribe-live session with token refresh, reconnect and proactive rotation.
// ----------------------------------------------------------------------------------------------------------------
export type SttStatus = "connecting" | "live";

export type GeminiSttOptions = {
  getToken: () => Promise<TokenResponse>;
  onInterim(text: string): void;
  onUtterance(text: string, info: UtteranceInfo): void;
  onLevel?(rms: number): void;
  onStatus(status: SttStatus, detail?: string): void;
  /** Unrecoverable failure after start() succeeded (the caller should switch to a fallback). */
  onFatal(err: Error): void;
  log?(msg: string): void;
  now?: () => number;
};

type Link = { gen: number; session: Session; openedAt: number; ready: boolean };

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

function int16ToBase64(chunks: Int16Array[]): string {
  let len = 0;
  for (const c of chunks) len += c.length;
  const bytes = new Uint8Array(len * 2);
  let o = 0;
  for (const c of chunks) {
    bytes.set(new Uint8Array(c.buffer, c.byteOffset, c.byteLength), o);
    o += c.byteLength;
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}

const MIME = `audio/pcm;rate=${SAMPLE_RATE}`;

export class GeminiStt {
  readonly seg: Segmenter;
  private o: GeminiSttOptions;
  private now: () => number;
  private gen = 0;
  private active: Link | null = null;
  private stopped = false;
  private started = false;
  private reconnecting = false;
  private swapping = false;
  private nextSwapTry = 0;
  private goAwayDeadline = 0;
  private drops: number[] = [];
  private queue: Int16Array[] = [];
  private batch: Int16Array[] = [];
  private lastHousekeeping = 0;

  constructor(o: GeminiSttOptions) {
    this.o = o;
    this.now = o.now ?? (() => performance.now());
    this.seg = new Segmenter(
      {
        onInterim: (t) => o.onInterim(t),
        onUtterance: (t, i) => o.onUtterance(t, i),
        onLevel: o.onLevel,
        sendAudio: (f) => this.sendAudio(f),
        sendStreamEnd: () => this.sendStreamEnd(),
        log: o.log,
      },
      { now: this.now, expectFinal: true },
    );
  }

  /** Connects the first session. Rejects (and leaves nothing running) if the token or connection fails. */
  async start(): Promise<void> {
    this.o.onStatus("connecting");
    const link = await this.connect();
    if (this.stopped) {
      try {
        link.session.close();
      } catch {
        /* ignore */
      }
      throw new Error("stopped");
    }
    this.activate(link);
    this.started = true;
    this.o.onStatus("live", LIVE_MODEL);
  }

  pushAudio(samples: Int16Array): void {
    if (this.stopped) return;
    this.seg.pushAudio(samples);
    const now = this.now();
    if (now - this.lastHousekeeping > 250) {
      this.lastHousekeeping = now;
      this.housekeeping(now);
    }
  }

  stop(flush = true): void {
    if (this.stopped) return;
    if (flush) this.seg.flush();
    this.stopped = true;
    this.flushBatch();
    const l = this.active;
    this.active = null;
    if (l)
      try {
        l.session.close();
      } catch {
        /* ignore */
      }
  }

  /** Test hook: kill the socket as if the network dropped. */
  debugDrop(): void {
    try {
      this.active?.session.close();
    } catch {
      /* ignore */
    }
  }

  get sessionAgeMs() {
    return this.active ? this.now() - this.active.openedAt : 0;
  }

  // ---------------- connection management ----------------
  private async connect(): Promise<Link> {
    const tok = await withTimeout(this.o.getToken(), TUNING.TOKEN_TIMEOUT_MS, "token fetch");
    if (!tok || !tok.token) throw new Error("token response has no token");
    const ai = new GoogleGenAI({ apiKey: tok.token, httpOptions: { apiVersion: tok.apiVersion || "v1alpha" } });
    const gen = ++this.gen;
    let resolveReady!: () => void;
    let rejectReady!: (e: Error) => void;
    const ready = new Promise<void>((res, rej) => ((resolveReady = res), (rejectReady = rej)));
    const connecting = ai.live.connect({
      model: tok.model || LIVE_MODEL,
      config: { responseModalities: [Modality.TEXT], inputAudioTranscription: { languageCodes: ["en-US"] } },
      callbacks: {
        onmessage: (m: LiveServerMessage) => {
          if (m.setupComplete) resolveReady();
          this.onMessage(gen, m);
        },
        onerror: (e: ErrorEvent) => {
          const msg = `socket error${e?.message ? ": " + e.message : ""}`;
          rejectReady(new Error(msg));
          this.onDown(gen, msg);
        },
        onclose: (e: CloseEvent) => {
          const msg = `socket closed ${e?.code ?? ""} ${e?.reason ?? ""}`.trim();
          rejectReady(new Error(msg));
          this.onDown(gen, msg);
        },
      },
    });
    let session: Session | null = null;
    try {
      session = await withTimeout(connecting, TUNING.CONNECT_TIMEOUT_MS, "live connect");
      await withTimeout(ready, TUNING.CONNECT_TIMEOUT_MS, "live setup");
    } catch (e) {
      if (session)
        try {
          session.close();
        } catch {
          /* ignore */
        }
      else connecting.then((s) => s.close()).catch(() => {});
      throw e instanceof Error ? e : new Error(String(e));
    }
    return { gen, session, openedAt: this.now(), ready: true };
  }

  private activate(link: Link) {
    const old = this.active;
    this.active = link;
    this.goAwayDeadline = 0;
    if (old && old !== link) {
      this.flushBatchTo(old);
      setTimeout(() => {
        try {
          old.session.close();
        } catch {
          /* ignore */
        }
      }, 50);
    }
    // replay audio captured while there was no usable session
    if (this.queue.length) {
      const q = this.queue;
      this.queue = [];
      for (let i = 0; i < q.length; i += 5) this.sendNow(link, q.slice(i, i + 5));
    }
  }

  private onMessage(gen: number, m: LiveServerMessage) {
    if (this.stopped) return;
    if (!this.active || gen !== this.active.gen) return; // stale or not-yet-active session
    if (m.goAway) {
      const left = parseFloat(String(m.goAway.timeLeft ?? "10").replace(/s$/, "")) * 1000 || 10000;
      this.o.log?.(`goAway, timeLeft ${m.goAway.timeLeft}`);
      this.goAwayDeadline = this.now() + Math.max(0, left - 2500);
    }
    this.seg.onServerMessage(m);
  }

  private onDown(gen: number, why: string) {
    if (this.stopped || !this.started) return;
    if (!this.active || gen !== this.active.gen) return; // an old session we closed ourselves
    this.o.log?.(`session down: ${why}`);
    this.active = null;
    void this.reconnect(why);
  }

  private async reconnect(why: string) {
    if (this.reconnecting || this.stopped) return;
    this.reconnecting = true;
    const now = this.now();
    this.drops = this.drops.filter((t) => now - t < 60_000);
    this.drops.push(now);
    this.seg.rebaseTurn();
    this.o.onStatus("connecting", `reconnecting (${why})`);
    try {
      if (this.drops.length > 3) throw new Error(`session dropped ${this.drops.length} times in a minute (${why})`);
      const link = await this.connect();
      if (this.stopped) {
        link.session.close();
        return;
      }
      this.activate(link);
      this.o.onStatus("live", LIVE_MODEL);
    } catch (e) {
      if (this.stopped) return;
      const err = e instanceof Error ? e : new Error(String(e));
      this.o.log?.(`reconnect failed: ${err.message}`);
      this.stop(true);
      this.o.onFatal(err);
    } finally {
      this.reconnecting = false;
    }
  }

  private housekeeping(now: number) {
    const l = this.active;
    if (!l || this.swapping || this.reconnecting) return;
    const old = now - l.openedAt > TUNING.PROACTIVE_RECONNECT_MS;
    const idle = this.seg.idleMs(now) >= TUNING.RECONNECT_IDLE_MS;
    const forced = this.goAwayDeadline > 0 && now >= this.goAwayDeadline;
    if (((old || this.goAwayDeadline > 0) && idle && now >= this.nextSwapTry) || forced) void this.swap(forced ? "goAway deadline" : old ? "session age" : "goAway");
  }

  /** Make-before-break: open a fresh session, then switch audio to it. */
  private async swap(why: string) {
    this.swapping = true;
    this.o.log?.(`rotating session (${why})`);
    try {
      const link = await this.connect();
      if (this.stopped) {
        link.session.close();
        return;
      }
      this.seg.rebaseTurn();
      this.activate(link);
      this.o.log?.("rotated to a fresh session");
    } catch (e) {
      this.o.log?.(`rotation failed: ${e instanceof Error ? e.message : e}`);
      this.nextSwapTry = this.now() + 20_000;
      if (this.goAwayDeadline > 0) this.goAwayDeadline = 0; // the close (if it comes) goes through reconnect()
    } finally {
      this.swapping = false;
    }
  }

  // ---------------- audio out ----------------
  private sendAudio(frame: Int16Array) {
    if (!this.active) {
      this.queue.push(frame);
      const max = Math.round(TUNING.QUEUE_MAX_MS / FRAME_MS);
      if (this.queue.length > max) this.queue.splice(0, this.queue.length - max);
      return;
    }
    this.batch.push(frame);
    if (this.batch.length >= TUNING.SEND_BATCH_FRAMES) this.flushBatch();
  }

  private sendStreamEnd() {
    if (!this.active) {
      this.queue = []; // nothing useful to replay once the segment has ended
      return;
    }
    this.flushBatch();
    try {
      this.active.session.sendRealtimeInput({ audioStreamEnd: true });
    } catch (e) {
      this.o.log?.(`streamEnd send failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  private flushBatch() {
    if (this.active) this.flushBatchTo(this.active);
  }

  private flushBatchTo(l: Link) {
    if (!this.batch.length) return;
    const b = this.batch;
    this.batch = [];
    this.sendNow(l, b);
  }

  private sendNow(l: Link, frames: Int16Array[]) {
    try {
      l.session.sendRealtimeInput({ audio: { data: int16ToBase64(frames), mimeType: MIME } });
    } catch (e) {
      this.o.log?.(`audio send failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
