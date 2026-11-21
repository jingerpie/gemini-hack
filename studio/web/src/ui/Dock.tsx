import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ChipState } from "../App";

type Props = {
  chip: ChipState;
  listening: boolean;
  levelRef: MutableRefObject<number>;
  onToggle(): void;
  onSend(text: string): void;
};

export function Dock({ chip, listening, levelRef, onToggle, onSend }: Props) {
  const [text, setText] = useState("");
  return (
    <div className="dock-row">
      <form
        className="command"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          onSend(t);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={chip === "fallback" ? "Mic unavailable — type a change…" : "Or type a change and press Enter"}
          spellCheck={false}
          aria-label="Type a command"
        />
        <kbd>↵</kbd>
      </form>

      <button className={`mic ${listening ? "mic-on" : ""} ${chip === "connecting" ? "mic-connecting" : ""}`} onClick={onToggle}>
        {listening ? (
          <>
            <Meter levelRef={levelRef} />
            <span className="mic-label">{chip === "connecting" ? "Connecting…" : "Listening…"}</span>
            <span className="mic-stop">
              <i /> Stop
            </span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
              <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="mic-label">Start talking</span>
            <kbd>Space</kbd>
          </>
        )}
      </button>

      <div className="legend">
        <span>
          <i className="dot dot-patch" /> orchestrator · gemini-4-hydrogen
        </span>
        <span>
          <i className="dot dot-asset" /> managed agent · antigravity
        </span>
        <span>
          <i className="dot dot-decal" /> image · nano-banana
        </span>
      </div>
    </div>
  );
}

const BARS = 9;
function Meter({ levelRef }: { levelRef: MutableRefObject<number> }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const hist = new Array(BARS).fill(0);
    let raf = 0;
    let smooth = 0;
    let frame = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const target = Math.min(1, Math.sqrt(Math.max(0, levelRef.current)) * 1.4);
      smooth += (target - smooth) * 0.35;
      if (++frame % 3 === 0) {
        hist.shift();
        hist.push(smooth);
      }
      const el = ref.current;
      if (!el) return;
      const kids = el.children;
      for (let i = 0; i < BARS; i++) {
        const center = 1 - Math.abs(i - (BARS - 1) / 2) / BARS;
        const v = hist[i] * (0.55 + 0.45 * center);
        (kids[i] as HTMLElement).style.transform = `scaleY(${(0.14 + v * 0.86).toFixed(3)})`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);
  return (
    <span className="meter" ref={ref} aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}
