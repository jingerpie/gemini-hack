// The work strip: a baseline whose x axis is wall-clock time. Every task is a ⊔ bracket hanging under it:
// it drops at dispatch, grows right while running (→), and turns back up (↑) when it returns.
// Rendered on a canvas from requestAnimationFrame, reading the task manager's live task list directly.
import { useEffect, useRef, useState } from "react";
import { DESIGNER_HINT_MS, type Task, type TaskManager } from "../lib/taskManager";

export const HUES = {
  patch: "#6f90bd",
  asset: "#8270c0",
  decal: "#4fa39a",
  source: "#c9934a",
  render: "#4fa39a", // the image model's colour
} as const;
export const DESIGNER_HUE = "#c77fb4";
const MAX_LANES = 4; // lanes 0..3 are drawn; anything deeper is summarized as "+N more"

const PX_PER_S = 21;
const PX_PER_MS = PX_PER_S / 1000;
const LEFT_PAD = 18;
const RIGHT_PAD = 30;
const BASE_Y = 22;
const FIRST_LANE = 16; // px below the baseline
const LANE_GAP = 12;
const HOLD_MS = 6000;
const FADE_MS = 1500;
const FAIL = "#d0605a";
const NOCHANGE = "#6d7480";

type Hit = { id: string; x0: number; x1: number; y: number };

export function Timeline({ manager }: { manager: TaskManager }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const hitsRef = useRef<Hit[]>([]);
  const [tip, setTip] = useState<{ x: number; y: number; w: number; task: Task } | null>(null);
  const tipIdRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      draw();
    };

    const draw = () => {
      const t = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const start = manager.getClockStart();
      const right = w - RIGHT_PAD;
      const rawNow = start == null ? LEFT_PAD : LEFT_PAD + (t - start) * PX_PER_MS;
      const scroll = Math.max(0, rawNow - right);
      const nowX = rawNow - scroll;
      const xOf = (ms: number) => LEFT_PAD + (ms - (start ?? t)) * PX_PER_MS - scroll;

      // time ticks every 5 s
      ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = "alphabetic";
      if (start != null) {
        const firstS = Math.max(0, Math.floor(((scroll - 0) / PX_PER_MS) / 5000) * 5);
        for (let s = firstS; ; s += 5) {
          const x = xOf(start + s * 1000);
          if (x > nowX + 0.5) break;
          if (x < -40) continue;
          const major = s % 30 === 0;
          ctx.strokeStyle = major ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, BASE_Y - (major ? 5 : 3));
          ctx.lineTo(Math.round(x) + 0.5, BASE_Y);
          ctx.stroke();
          if (s % 15 === 0 && x > 4 && nowX - x > 26) {
            ctx.fillStyle = "rgba(255,255,255,0.26)";
            const m = Math.floor(s / 60);
            const ss = String(s % 60).padStart(2, "0");
            ctx.fillText(`${m}:${ss}`, x + 3, BASE_Y - 6);
          }
        }
      }

      // baseline: solid up to now, faint dotted future
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(225,230,240,0.34)";
      ctx.beginPath();
      ctx.moveTo(0, BASE_Y + 0.5);
      ctx.lineTo(nowX, BASE_Y + 0.5);
      ctx.stroke();
      ctx.setLineDash([1, 4]);
      ctx.strokeStyle = "rgba(225,230,240,0.16)";
      ctx.beginPath();
      ctx.moveTo(nowX, BASE_Y + 0.5);
      ctx.lineTo(w, BASE_Y + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // lanes: compress spacing if many concurrent tasks
      const tasks = manager.liveTasks().filter((k) => k.status !== "queued");
      let maxLane = 0;
      for (const k of tasks) if (k.lane > maxLane && k.lane < MAX_LANES) maxLane = k.lane;
      let overflow = 0;
      let queued = 0;
      for (const k of manager.liveTasks()) {
        if (k.status === "queued") queued++;
        else if (k.endAt == null && k.lane >= MAX_LANES) overflow++;
      }
      const extraRow = overflow + queued > 0 ? 1 : 0;
      const gap = Math.min(LANE_GAP, (h - BASE_Y - FIRST_LANE - 8) / Math.max(1, maxLane + extraRow));
      const laneY = (lane: number) => BASE_Y + FIRST_LANE + lane * gap;

      // A patch stays on the strip while any job it handed off is still visible, so the hand-off keeps reading.
      const fadeFrom = new Map<string, number>();
      for (const k of tasks) {
        const e = k.endAt ?? Infinity;
        fadeFrom.set(k.id, Math.max(fadeFrom.get(k.id) ?? -Infinity, e));
        if (k.parentId) fadeFrom.set(k.parentId, Math.max(fadeFrom.get(k.parentId) ?? -Infinity, e));
      }
      const fadeAt = (k: Task) => fadeFrom.get(k.id) ?? k.endAt ?? Infinity;

      const hits: Hit[] = [];
      const hoverId = tipIdRef.current;
      // draw children after parents so the hand-off reads left-to-right; draw running on top
      const order = tasks
        .filter((k) => {
          if (k.lane >= MAX_LANES) return false;
          if (k.endAt == null) return true;
          return t - fadeAt(k) < HOLD_MS + FADE_MS;
        })
        .sort((a, b) => (a.endAt == null ? 1 : 0) - (b.endAt == null ? 1 : 0) || a.startAt - b.startAt);

      for (const k of order) {
        const ended = k.endAt != null;
        const alpha = ended ? clamp01(1 - (t - fadeAt(k) - HOLD_MS) / FADE_MS) : 1;
        if (alpha <= 0) continue;
        const x0 = xOf(k.startAt);
        const x1 = Math.max(x0, ended ? xOf(k.endAt!) : nowX);
        if (x1 < -10) continue;
        const y = laneY(k.lane);
        const failed = k.status === "failed";
        const stopped = k.status === "cancelled" || k.status === "superseded";
        const nochange = k.status === "nochange";
        const hovered = hoverId === k.id;
        const planning = k.kind === "patch" && !ended && t - k.startAt > DESIGNER_HINT_MS;
        const designer = k.kind === "patch" && (k.designer || planning);
        let color: string = designer ? DESIGNER_HUE : HUES[k.kind];
        if (nochange) color = NOCHANGE;
        ctx.globalAlpha = alpha * (nochange ? 0.75 : stopped ? 0.6 : 1);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = (nochange ? 1 : designer ? 2.4 : 1.6) + (hovered ? 1 : 0);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const len = x1 - x0;
        const r = Math.min(4, len / 2, (y - BASE_Y) / 2);
        const returned = ended && !failed && !stopped;

        ctx.beginPath();
        ctx.moveTo(x0, BASE_Y + 1);
        ctx.lineTo(x0, y - r);
        ctx.quadraticCurveTo(x0, y, x0 + r, y);
        if (!ended) {
          // running: grow to now, arrowhead points right
          ctx.lineTo(Math.max(x0 + r, x1 - 1), y);
          ctx.stroke();
          arrowRight(ctx, x1 + 2, y, hovered ? 5 : 4.2);
          if (planning) {
            ctx.font = "500 10px Inter, system-ui, sans-serif";
            ctx.textBaseline = "middle";
            const label = "designer is planning the room…";
            const tw = ctx.measureText(label).width;
            const lx = x1 - tw - 14 > x0 + 8 ? x1 - tw - 14 : x1 + 12;
            ctx.globalAlpha = alpha * 0.95;
            ctx.fillText(label, lx, y - 6);
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = color;
          }
          // soft pulse at the head
          const p = (Math.sin(t / 220) + 1) / 2;
          ctx.globalAlpha = alpha * (0.12 + 0.18 * p);
          ctx.beginPath();
          ctx.arc(x1 + 1, y, 5 + p * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (returned) {
          ctx.lineTo(x1 - r, y);
          ctx.quadraticCurveTo(x1, y, x1, y - r);
          ctx.lineTo(x1, BASE_Y + 5);
          ctx.stroke();
          arrowUp(ctx, x1, BASE_Y + 1.5, nochange ? 3.2 : 4);
        } else {
          ctx.lineTo(x1, y);
          ctx.stroke();
          cross(ctx, x1 + 3.5, y, failed ? FAIL : "rgba(200,205,215,0.7)", 3);
        }
        ctx.globalAlpha = 1;
        hits.push({ id: k.id, x0, x1: x1 + 6, y });
      }

      if (overflow + queued > 0) {
        const parts: string[] = [];
        if (overflow) parts.push(`+${overflow} more running`);
        if (queued) parts.push(`${queued} queued`);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "rgba(225,230,240,0.6)";
        ctx.font = "500 10px Inter, system-ui, sans-serif";
        ctx.textBaseline = "middle";
        const txt = parts.join(" · ");
        const tw = ctx.measureText(txt).width;
        ctx.fillText(txt, Math.max(LEFT_PAD, Math.min(nowX - tw - 10, w - tw - 8)), Math.min(h - 7, laneY(maxLane + 1)));
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = 1;
      }

      // now marker
      if (start != null) {
        const g = ctx.createRadialGradient(nowX, BASE_Y, 0, nowX, BASE_Y, 9);
        g.addColorStop(0, "rgba(160,190,240,0.55)");
        g.addColorStop(1, "rgba(160,190,240,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nowX, BASE_Y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = start == null ? "rgba(225,230,240,0.45)" : "#dfe7f5";
      ctx.beginPath();
      ctx.arc(nowX, BASE_Y + 0.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (start == null) {
        ctx.fillStyle = "rgba(225,230,240,0.28)";
        ctx.font = "500 10.5px Inter, system-ui, sans-serif";
        ctx.fillText("work appears here as you talk", LEFT_PAD + 12, BASE_Y + 22);
      }

      hitsRef.current = hits;
      updateHover();
    };

    const updateHover = () => {
      const hv = hoverRef.current;
      let best: Hit | null = null;
      if (hv) {
        let bestD = Infinity;
        for (const hb of hitsRef.current) {
          if (hv.x < hb.x0 - 5 || hv.x > hb.x1 + 5) continue;
          if (hv.y < BASE_Y - 4 || hv.y > hb.y + 6) continue;
          const d = Math.abs(hv.y - hb.y);
          if (d < bestD) {
            bestD = d;
            best = hb;
          }
        }
      }
      const id = best?.id ?? null;
      if (id !== tipIdRef.current) {
        tipIdRef.current = id;
        const task = id ? manager.liveTasks().find((k) => k.id === id) : undefined;
        setTip(task && hv ? { x: hv.x, y: hv.y, w, task: { ...task } } : null);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [manager]);

  return (
    <div
      className="timeline"
      ref={wrapRef}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onMouseLeave={() => {
        hoverRef.current = null;
      }}
      onClick={() => {
        if (tipIdRef.current) manager.focus(tipIdRef.current);
      }}
      style={{ cursor: tip ? "pointer" : "default" }}
    >
      <canvas ref={canvasRef} />
      {tip && <TimelineTip tip={tip} manager={manager} />}
    </div>
  );
}

function TimelineTip({ tip, manager }: { tip: { x: number; y: number; w: number; task: Task }; manager: TaskManager }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);
  const live = manager.liveTasks().find((k) => k.id === tip.task.id) ?? tip.task;
  const ms = live.endAt != null ? live.endAt - live.startAt : performance.now() - live.startAt;
  const label = live.kind === "patch" ? `“${live.title}”` : live.title;
  const flip = tip.x > tip.w / 2;
  const pos = flip ? { right: Math.max(8, tip.w - tip.x - 10) } : { left: Math.max(8, tip.x - 10) };
  return (
    <div className="timeline-tip" style={{ ...pos, top: Math.max(4, tip.y - 44) }}>
      <span className={`dot dot-${live.kind === "patch" && live.designer ? "designer" : live.kind}`} />
      <span className="tip-label">{label}</span>
      <span className="tip-ms">
        {fmtMs(ms)}
        {live.endAt == null ? "…" : ""}
        {live.status !== "running" && live.status !== "done" ? ` · ${live.status}` : ""}
        {(live.kind === "patch" || live.kind === "render") && live.model ? ` · ${live.model}` : ""}
      </span>
    </div>
  );
}

export function fmtMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  const m = Math.floor(ms / 60000);
  return `${m}m ${Math.round((ms % 60000) / 1000)}s`;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function arrowRight(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * 1.25, y - s * 0.8);
  ctx.lineTo(x - s * 1.25, y + s * 0.8);
  ctx.closePath();
  ctx.fill();
}

function arrowUp(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * 0.8, y + s * 1.25);
  ctx.lineTo(x + s * 0.8, y + s * 1.25);
  ctx.closePath();
  ctx.fill();
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}
