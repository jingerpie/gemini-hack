import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Engine, Voice, VoiceHandlers, VoiceState } from "./types";
import { TaskManager } from "./lib/taskManager";
import { Timeline } from "./ui/Timeline";
import { Sidebar } from "./ui/Sidebar";
import { Dock } from "./ui/Dock";
import { Hud } from "./ui/Hud";

// ?mock=1 → mock engine + api + voice.  ?mock=api → real 3D engine, mock api + voice.  (none) → all real.
const MOCK_MODE = new URLSearchParams(location.search).get("mock");
const MOCK = MOCK_MODE != null && MOCK_MODE !== "0";

// One manager per page load (survives StrictMode double effects).
const manager = new TaskManager();
(window as unknown as { __studio: TaskManager }).__studio = manager;

type Factories = {
  createEngine: (el: HTMLElement) => Engine;
  createVoice: (h: VoiceHandlers) => Voice;
};

let factoriesPromise: Promise<Factories> | null = null;
function loadFactories(): Promise<Factories> {
  if (!factoriesPromise) {
    factoriesPromise =
      MOCK_MODE === "api"
        ? // real 3D engine, mock server + scripted voice
          Promise.all([import("./scene/engine"), import("./lib/mockVoice"), import("./lib/mockApi")]).then(([e, v, a]) => {
            manager.setApi(a.createMockApi());
            return { createEngine: e.createEngine, createVoice: v.createMockVoice };
          })
        : MOCK
      ? Promise.all([import("./lib/mockEngine"), import("./lib/mockVoice"), import("./lib/mockApi")]).then(
          ([e, v, a]) => {
            manager.setApi(a.createMockApi());
            return { createEngine: e.createMockEngine, createVoice: v.createMockVoice };
          },
        )
      : import("./lib/realModules").then((m) => {
          manager.setApi(m.httpApi);
          return { createEngine: m.createEngine, createVoice: m.createVoice };
        });
  }
  return factoriesPromise;
}

export type ChipState = "idle" | "connecting" | "listening" | "fallback";

export default function App() {
  const state = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceDetail, setVoiceDetail] = useState<string>("");
  const levelRef = useRef(0);
  const voiceRef = useRef<Voice | null>(null);

  // ---- engine: created once per mount; StrictMode's mount→unmount→mount disposes the first one ----
  useEffect(() => {
    let cancelled = false;
    let engine: Engine | null = null;
    loadFactories()
      .then((f) => {
        if (cancelled || !viewportRef.current) return;
        engine = f.createEngine(viewportRef.current);
        manager.attachEngine(engine);
        setEngineReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setEngineError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
      if (engine) {
        manager.attachEngine(null);
        try {
          engine.dispose();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  // ---- voice ----
  useEffect(() => {
    return () => {
      voiceRef.current?.stop();
      voiceRef.current = null;
    };
  }, []);

  const startVoice = useCallback(async () => {
    try {
      const f = await loadFactories();
      if (!voiceRef.current) {
        voiceRef.current = f.createVoice({
          onInterim: (t) => manager.setInterim(t),
          onUtterance: (t) => manager.utterance(t),
          onState: (s, detail) => {
            setVoiceState(s);
            setVoiceDetail(detail ?? "");
            if (s === "listening") manager.startClock();
            if (s !== "listening") levelRef.current = 0;
          },
          onLevel: (rms) => {
            levelRef.current = rms;
          },
        });
      }
      manager.startClock();
      await voiceRef.current.start();
    } catch (err) {
      console.error(err);
      setVoiceState("error");
      setVoiceDetail(String((err as Error)?.message ?? err));
    }
  }, []);

  const stopVoice = useCallback(() => {
    voiceRef.current?.stop();
    setVoiceState("idle");
    levelRef.current = 0;
    manager.setInterim("");
  }, []);

  const listening = voiceState === "listening" || voiceState === "connecting";
  const toggleVoice = useCallback(() => {
    if (listening) stopVoice();
    else void startVoice();
  }, [listening, startVoice, stopVoice]);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        manager.undo();
      } else if (e.code === "Space" && !typing && !e.repeat) {
        e.preventDefault();
        toggleVoice();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleVoice]);

  const chip: ChipState =
    voiceState === "error" ? "fallback" : voiceState === "connecting" ? "connecting" : voiceState === "listening" ? "listening" : "idle";

  const stats = useMemo(() => {
    const ms = state.patchMs;
    const last = ms.length ? ms[ms.length - 1] : null;
    const sorted = ms.slice().sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
    const jobs = state.tasks.filter((t) => t.kind !== "patch" && t.status === "running").length;
    return { last, median, jobs };
  }, [state.patchMs, state.tasks]);

  return (
    <div className="app">
      <main className="stage">
        <div className="viewport-frame">
          <div className="viewport" ref={viewportRef} />
          {!engineReady && (
            <div className="viewport-empty">
              {engineError ? (
                <>
                  <b>3D engine failed to load</b>
                  <span>{engineError}</span>
                </>
              ) : (
                <span className="loading">Loading room…</span>
              )}
            </div>
          )}
          <Hud
            chip={chip}
            chipDetail={voiceDetail}
            mock={MOCK}
            verifyEnabled={state.verifyEnabled}
            onVerify={(on) => manager.setVerifyEnabled(on)}
            onUndo={() => manager.undo()}
            shopEnabled={state.shopEnabled}
            onShop={(on) => manager.setShopEnabled(on)}
            onNewRoom={() => manager.newRoom()}
            stats={stats}
          />
        </div>
        <section className="dock">
          <Timeline manager={manager} />
          <Dock
            chip={chip}
            listening={listening}
            levelRef={levelRef}
            onToggle={toggleVoice}
            onSend={(text) => manager.utterance(text)}
          />
        </section>
      </main>
      <Sidebar state={state} manager={manager} />
    </div>
  );
}
