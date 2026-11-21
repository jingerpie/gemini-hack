// Browser voice input: mic -> AudioWorklet (16 kHz Int16) -> GeminiStt (gemini-3.5-transcribe-live via /api/token)
// with automatic fallback to the browser's webkitSpeechRecognition. Segmentation logic lives in stt-core.ts.
//
//   ?stt=browser  force the browser recogniser       ?stt=gemini  force Gemini (retry instead of falling back)
//
// start() must be called from a user gesture (click / key): it creates the AudioContext and asks for the mic.
import type { TokenResponse, Voice, VoiceHandlers } from "../types";
import { GeminiStt, SAMPLE_RATE, Segmenter, TUNING } from "./stt-core";

export { TUNING as VOICE_TUNING };

const LEVEL_INTERVAL_MS = 66; // ~15 onLevel calls per second
const GEMINI_RETRY_MS = 3000; // ?stt=gemini: wait between restart attempts after a fatal error

// AudioWorklet: box-filter decimation of the mic stream to 16 kHz, posts 20 ms Int16 frames. Loaded from a Blob URL so
// it works the same under the Vite dev server and in a production build.
const WORKLET_SRC = `
class PcmDown16k extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${SAMPLE_RATE};
    this.acc = 0; this.cnt = 0; this.pos = 0;
    this.out = new Int16Array(320); this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i]; this.cnt++; this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        let v = this.acc / this.cnt; this.acc = 0; this.cnt = 0;
        v = v < -1 ? -1 : v > 1 ? 1 : v;
        this.out[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.n === 320) {
          this.port.postMessage(this.out.buffer, [this.out.buffer]);
          this.out = new Int16Array(320); this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-down-16k', PcmDown16k);
`;

type Mode = "auto" | "gemini" | "browser";

function sttMode(): Mode {
  try {
    const v = new URLSearchParams(window.location.search).get("stt");
    return v === "browser" || v === "gemini" ? v : "auto";
  } catch {
    return "auto";
  }
}

async function fetchToken(): Promise<TokenResponse> {
  const r = await fetch("/api/token", { cache: "no-store" });
  if (!r.ok) throw new Error(`/api/token ${r.status}`);
  const j = (await r.json()) as TokenResponse;
  if (!j || !j.token) throw new Error("/api/token returned no token");
  return j;
}

/** 0..1 meter value from linear RMS: -60 dBFS -> 0, -10 dBFS -> 1. */
function meter(rms: number) {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.max(0, Math.min(1, (db + 60) / 50));
}

// ---------------------------------------------------------------------------------------------------------------
// Fallback: browser SpeechRecognition, segmented by the same Segmenter (our VAD decides when an utterance ends).
// ---------------------------------------------------------------------------------------------------------------
type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

class BrowserStt {
  readonly seg: Segmenter;
  private rec: SR | null = null;
  private stopped = false;
  private finals = new Set<number>();
  private restarts: number[] = [];
  private onFatal: (msg: string) => void;

  constructor(h: VoiceHandlers, onLevel: (rms: number) => void, onFatal: (msg: string) => void) {
    this.onFatal = onFatal;
    this.seg = new Segmenter(
      { onInterim: (t) => h.onInterim(t), onUtterance: (t) => h.onUtterance(t), onLevel },
      { expectFinal: false, gate: false, lagMs: 350 },
    );
  }

  static available() {
    const w = window as any;
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  start() {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) throw new Error("this browser has no SpeechRecognition");
    const rec: SR = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;
    rec.onstart = () => this.finals.clear();
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text: string = r[0]?.transcript ?? "";
        if (r.isFinal) {
          if (!this.finals.has(i)) {
            this.finals.add(i);
            this.seg.handleFinal(text);
          }
        } else interim += text;
      }
      if (interim.trim()) this.seg.handleInterim(interim);
    };
    rec.onerror = (e: any) => {
      const err = String(e?.error || "unknown");
      if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
        this.stopped = true;
        this.onFatal(`browser speech: ${err}`);
      }
      // "no-speech", "network", "aborted": onend restarts
    };
    rec.onend = () => {
      if (this.stopped) return;
      const now = Date.now();
      this.restarts = this.restarts.filter((t) => now - t < 10_000);
      this.restarts.push(now);
      const delay = this.restarts.length > 4 ? 2000 : 150; // back off if it keeps dying (e.g. offline)
      setTimeout(() => {
        if (this.stopped) return;
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }, delay);
    };
    this.rec = rec;
    rec.start();
  }

  pushAudio(pcm: Int16Array) {
    if (!this.stopped) this.seg.pushAudio(pcm);
  }

  stop() {
    if (this.stopped) return;
    this.seg.flush();
    this.stopped = true;
    try {
      this.rec?.abort();
    } catch {
      /* ignore */
    }
    this.rec = null;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// createVoice
// ---------------------------------------------------------------------------------------------------------------
export function createVoice(handlers: VoiceHandlers): Voice {
  const h = handlers;
  let run = 0; // incremented by stop(): async work from an older run checks it and bails out
  let starting: Promise<void> | null = null;
  let active = false;

  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let sink: GainNode | null = null;
  let gem: GeminiStt | null = null;
  let browser: BrowserStt | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  let levelMax = 0;
  let levelAt = 0;
  const onLevel = (rms: number) => {
    if (!h.onLevel) return;
    if (rms > levelMax) levelMax = rms;
    const now = performance.now();
    if (now - levelAt >= LEVEL_INTERVAL_MS) {
      levelAt = now;
      h.onLevel(meter(levelMax));
      levelMax = 0;
    }
  };

  const onPcm = (pcm: Int16Array) => {
    if (gem) gem.pushAudio(pcm);
    else if (browser) browser.pushAudio(pcm);
    else onLevel(rmsOf(pcm));
  };

  function startBrowser(myRun: number, reason?: string) {
    if (myRun !== run) return;
    if (!BrowserStt.available()) {
      h.onState("error", `speech recognition unavailable${reason ? ` (${reason})` : ""}`);
      return;
    }
    const b = new BrowserStt(h, onLevel, (msg) => {
      if (myRun !== run) return;
      browser = null;
      h.onState("error", msg);
    });
    try {
      b.start();
    } catch (e) {
      h.onState("error", `browser speech failed: ${e instanceof Error ? e.message : e}`);
      return;
    }
    browser = b;
    if (reason) console.warn("[voice] falling back to browser speech:", reason);
    h.onState("listening", "fallback: browser speech");
  }

  async function startGemini(myRun: number, mode: Mode): Promise<void> {
    const g = new GeminiStt({
      getToken: fetchToken,
      onInterim: (t) => h.onInterim(t),
      onUtterance: (t) => h.onUtterance(t),
      onLevel,
      onStatus: (s, d) => {
        if (myRun !== run || gem !== g) return;
        if (s === "connecting") h.onState("connecting", d);
        else h.onState("listening", d);
      },
      onFatal: (err) => {
        if (myRun !== run || gem !== g) return;
        gem = null;
        onGeminiFailure(myRun, mode, err.message);
      },
    });
    gem = g; // audio flows into it (and is queued) while it connects
    try {
      await g.start();
    } catch (e) {
      if (gem === g) gem = null;
      g.stop(false);
      if (myRun !== run) return;
      onGeminiFailure(myRun, mode, e instanceof Error ? e.message : String(e));
    }
  }

  function onGeminiFailure(myRun: number, mode: Mode, msg: string) {
    if (myRun !== run) return;
    if (mode === "gemini") {
      h.onState("connecting", `gemini failed (${msg}); retrying`);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (myRun === run) void startGemini(myRun, mode);
      }, GEMINI_RETRY_MS);
    } else startBrowser(myRun, msg);
  }

  async function doStart(myRun: number) {
    const mode = sttMode();
    h.onState("connecting");
    // Create/resume the AudioContext synchronously inside the user gesture.
    const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const c = new AC({ latencyHint: "interactive" });
    ctx = c;
    void c.resume().catch(() => {});
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch (e) {
      if (myRun !== run) return;
      const name = (e as { name?: string })?.name;
      teardownAudio();
      h.onState("error", name === "NotAllowedError" ? "microphone permission denied" : `microphone unavailable (${name || e})`);
      return;
    }
    if (myRun !== run) return;
    try {
      const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
      try {
        await c.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      if (myRun !== run) return;
      source = c.createMediaStreamSource(stream);
      node = new AudioWorkletNode(c, "pcm-down-16k", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
      sink = c.createGain();
      sink.gain.value = 0; // keep the graph pulled without making sound
      node.port.onmessage = (ev: MessageEvent<ArrayBuffer>) => onPcm(new Int16Array(ev.data));
      source.connect(node);
      node.connect(sink);
      sink.connect(c.destination);
      if (c.state !== "running") await c.resume().catch(() => {});
    } catch (e) {
      if (myRun !== run) return;
      teardownAudio();
      h.onState("error", `audio pipeline failed: ${e instanceof Error ? e.message : e}`);
      return;
    }
    if (myRun !== run) return;
    active = true;
    if (mode === "browser") startBrowser(myRun);
    else await startGemini(myRun, mode);
  }

  function teardownAudio() {
    try {
      if (node) node.port.onmessage = null;
      node?.disconnect();
      source?.disconnect();
      sink?.disconnect();
    } catch {
      /* ignore */
    }
    stream?.getTracks().forEach((t) => t.stop());
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
    node = null;
    source = null;
    sink = null;
    stream = null;
    ctx = null;
  }

  return {
    start(): Promise<void> {
      if (active) return Promise.resolve();
      if (starting) return starting;
      const myRun = ++run;
      starting = doStart(myRun).finally(() => {
        if (myRun === run) starting = null;
      });
      return starting;
    },
    stop(): void {
      run++;
      starting = null;
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      const g = gem;
      const b = browser;
      gem = null;
      browser = null;
      g?.stop(true); // flushes a pending utterance
      b?.stop();
      teardownAudio();
      h.onLevel?.(0);
      h.onState("idle");
    },
  };
}

function rmsOf(pcm: Int16Array) {
  let s = 0;
  for (let i = 0; i < pcm.length; i++) s += pcm[i] * pcm[i];
  return pcm.length ? Math.sqrt(s / pcm.length) / 32768 : 0;
}
