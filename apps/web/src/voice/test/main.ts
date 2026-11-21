// Minimal manual / headless test page for createVoice. Events are also recorded in window.__voice for Playwright.
import { createVoice } from "../voice";

type Ev = { t: number; kind: string; text?: string; detail?: string; level?: number };
const events: Ev[] = [];
let t0 = 0;
(window as any).__voice = events;
const $ = (id: string) => document.getElementById(id)!;
let levels = 0;

const voice = createVoice({
  onInterim: (text) => {
    events.push({ t: performance.now() - t0, kind: "interim", text });
    $("interim").textContent = text;
  },
  onUtterance: (text) => {
    events.push({ t: performance.now() - t0, kind: "utterance", text });
    console.log(`[voice] utterance @${Math.round(performance.now() - t0)}ms: ${text}`);
    const li = document.createElement("li");
    li.textContent = text;
    $("utts").appendChild(li);
    $("interim").textContent = "";
  },
  onState: (state, detail) => {
    events.push({ t: performance.now() - t0, kind: "state", text: state, detail });
    console.log(`[voice] state @${Math.round(performance.now() - t0)}ms: ${state} ${detail ?? ""}`);
    $("state").textContent = `${state} ${detail ?? ""}`;
  },
  onLevel: (level) => {
    levels++;
    (window as any).__levels = levels;
    if (level > 0.05) events.push({ t: performance.now() - t0, kind: "level", level });
    ($("bar") as HTMLElement).style.width = `${Math.round(level * 100)}%`;
  },
});

$("start").onclick = () => {
  t0 = performance.now();
  (window as any).__t0 = t0;
  void voice.start();
};
$("stop").onclick = () => voice.stop();
