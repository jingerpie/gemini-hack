// Photoreal render shown over the 3D view, with a draggable before/after split.
// The 3D room underneath stays the source of truth; closing the overlay leaves it untouched and editable.
import { useEffect, useRef, useState } from "react";
import type { RenderView } from "../lib/taskManager";
import { fmtMs } from "./Timeline";

export function RenderOverlay({ view, onClose }: { view: RenderView; onClose(): void }) {
  const [split, setSplit] = useState(50); // % from the left: left of it = 3D view, right = render
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => setSplit(50), [view.taskId]);

  const setFrom = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return;
    setSplit(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div className="render-overlay" role="dialog" aria-label="Photoreal render">
      <div
        className="render-box"
        ref={boxRef}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFrom(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFrom(e.clientX);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img className="render-img render-after" src={view.after} alt="Photoreal render of the room" draggable={false} />
        <img
          className="render-img render-before"
          src={view.before}
          alt="3D view"
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        />
        <div className="render-split" style={{ left: `${split}%` }}>
          <span className="render-handle" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M6.5 4.5 2 9l4.5 4.5M11.5 4.5 16 9l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <span className="render-tag render-tag-left" style={{ opacity: split > 12 ? 1 : 0 }}>
          3D scene
        </span>
        <span className="render-tag render-tag-right" style={{ opacity: split < 88 ? 1 : 0 }}>
          Photoreal
        </span>
      </div>
      <div className="render-bar">
        <span className="dot dot-render" />
        <span className="render-title">Photoreal render</span>
        <span className="render-meta">
          {view.model ? `${view.model} · ` : ""}
          {fmtMs(view.ms)}
        </span>
        <span className="render-hint">drag to compare · Esc to close</span>
        <button className="btn render-close" onClick={onClose} title="Close (Esc)">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M2 2l8 8M10 2 2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Close
        </button>
      </div>
    </div>
  );
}
