// ?mock=1 stand-in for voice/voice.ts: "speaks" a scripted session with word-by-word interim text.
import type { Voice, VoiceHandlers } from "../types";

const SCRIPT = [
  "paint the walls black",
  "put a BMW logo on the back wall",
  "I want a chair over there that looks like a throne",
  "make it shiny",
  "add a tall plant in the corner",
  "make the floor a light oak",
];

export function createMockVoice(h: VoiceHandlers): Voice {
  let timers: number[] = [];
  let levelTimer = 0;
  let running = false;
  let line = 0;
  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  const speak = () => {
    if (!running) return;
    const text = SCRIPT[line % SCRIPT.length];
    line++;
    const words = text.split(" ");
    let i = 0;
    const step = () => {
      if (!running) return;
      i++;
      h.onInterim(words.slice(0, i).join(" "));
      if (i < words.length) later(step, 160 + Math.random() * 170);
      else
        later(() => {
          if (!running) return;
          h.onUtterance(text);
          later(speak, 1600 + Math.random() * 2200);
        }, 450);
    };
    later(step, 200);
  };

  return {
    async start() {
      if (running) return;
      running = true;
      h.onState("connecting");
      await new Promise((r) => setTimeout(r, 450));
      if (!running) return;
      h.onState("listening");
      let phase = 0;
      levelTimer = window.setInterval(() => {
        phase += 0.35;
        h.onLevel?.(Math.max(0, 0.18 + 0.25 * Math.sin(phase) + Math.random() * 0.35));
      }, 60);
      speak();
    },
    stop() {
      running = false;
      timers.forEach(clearTimeout);
      timers = [];
      clearInterval(levelTimer);
      h.onLevel?.(0);
      h.onInterim("");
      h.onState("idle");
    },
  };
}
