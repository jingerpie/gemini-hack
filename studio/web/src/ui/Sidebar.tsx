import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StudioState, Task, TaskManager } from "../lib/taskManager";
import { fmtMs } from "./Timeline";

export function Sidebar({ state, manager }: { state: StudioState; manager: TaskManager }) {
  const [opsOpen, setOpsOpen] = useState(true);
  return (
    <aside className="sidebar">
      <section className="panel transcript-panel">
        <header className="panel-head">
          <h2>Transcript</h2>
          <span className="panel-meta">{state.transcript.filter((l) => l.kind === "user").length || ""}</span>
        </header>
        <Transcript state={state} />
      </section>

      <section className="panel tasks-panel">
        <header className="panel-head">
          <h2>Tasks</h2>
          <span className="panel-meta">
            {state.counters.running ? <span className="live-dot" /> : null}
            {state.counters.running ? `${state.counters.running} running` : state.tasks.length ? `${state.tasks.length}` : ""}
          </span>
        </header>
        <TaskList tasks={state.tasks} manager={manager} />
      </section>

      <section className={`panel ops-panel ${opsOpen ? "open" : ""}`}>
        <header className="panel-head clickable" onClick={() => setOpsOpen((o) => !o)}>
          <h2>
            <span className={`caret ${opsOpen ? "open" : ""}`}>›</span> Scene ops
          </h2>
          <span className="panel-meta">{state.opsLog.length || ""}</span>
        </header>
        {opsOpen && <OpsLog state={state} />}
        <div className="counters">
          <span>
            <b>{state.counters.objects}</b> objects
          </span>
          <span>
            <b>{state.counters.decals}</b> decals
          </span>
          <span>
            <b>{state.counters.done}</b> done
          </span>
          <span className={state.counters.failed ? "bad" : ""}>
            <b>{state.counters.failed}</b> failed
          </span>
        </div>
      </section>
    </aside>
  );
}

function useStickToBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [dep]);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };
  return { ref, onScroll };
}

function Transcript({ state }: { state: StudioState }) {
  const { ref, onScroll } = useStickToBottom(`${state.transcript.length}|${state.interim}`);
  const statusOf = (taskId?: string) => state.tasks.find((t) => t.id === taskId);
  const empty = state.transcript.length === 0 && !state.interim;
  return (
    <div className="transcript" ref={ref} onScroll={onScroll}>
      {empty && <p className="empty">No speech yet.</p>}
      {state.transcript.map((l) =>
        l.kind === "user" ? (
          <p key={l.id} className={`line line-user ${lineState(statusOf(l.taskId))}`}>
            {l.text}
          </p>
        ) : (
          <p key={l.id} className="line line-say">
            {l.text}
          </p>
        ),
      )}
      {state.interim && (
        <p className="line line-interim">
          {state.interim}
          <span className="cursor" />
        </p>
      )}
    </div>
  );
}

function lineState(t?: Task) {
  if (!t) return "";
  if (t.status === "running" || t.status === "held") return "pending";
  if (t.status === "failed") return "failed";
  return "";
}

function useTick(active: boolean, ms = 100) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

function TaskList({ tasks, manager }: { tasks: Task[]; manager: TaskManager }) {
  const anyRunning = tasks.some((t) => t.status === "running" || t.status === "held");
  useTick(anyRunning);
  const running = tasks.filter((t) => t.status === "running" || t.status === "held").sort((a, b) => b.startAt - a.startAt);
  const rest = tasks
    .filter((t) => t.status !== "running" && t.status !== "held")
    .sort((a, b) => b.startAt - a.startAt)
    .slice(0, 60);
  if (!tasks.length) return <div className="tasks"><p className="empty">Tasks you trigger show up here.</p></div>;
  return (
    <div className="tasks">
      {[...running, ...rest].map((t) => (
        <TaskCard key={t.id} task={t} manager={manager} />
      ))}
    </div>
  );
}

const STATUS_WORD: Record<Task["status"], string> = {
  running: "",
  held: "held",
  done: "",
  nochange: "no change",
  failed: "failed",
  cancelled: "cancelled",
  superseded: "superseded",
};

function TaskCard({ task: t, manager }: { task: Task; manager: TaskManager }) {
  const live = t.status === "running" || t.status === "held";
  const elapsed = (t.endAt ?? performance.now()) - t.startAt;
  const title = t.kind === "patch" ? `“${t.title}”` : t.title;
  const cancellable = t.status === "running" || t.status === "held";
  return (
    <div
      className={`card card-${t.kind} st-${t.status} ${t.targetId ? "focusable" : ""}`}
      onClick={() => manager.focus(t.id)}
      title={t.targetId ? `Focus ${t.targetId}` : undefined}
    >
      <div className="card-top">
        <span className={`dot dot-${t.kind} ${t.status === "running" ? "pulse" : ""}`} />
        <span className="card-title">{title}</span>
        <span className="card-time">
          {t.status === "running" ? fmtMs(performance.now() - t.startAt) : t.ms != null ? fmtMs(t.ms) : fmtMs(elapsed)}
        </span>
      </div>
      <div className="card-bottom">
        <span className={`card-status ${t.status === "failed" ? "bad" : ""}`} title={t.statusLine}>
          {STATUS_WORD[t.status] && <em className={`tag tag-${t.status}`}>{STATUS_WORD[t.status]}</em>}
          {t.status === "running" && t.kind !== "patch" && <span className="spinner" />}
          {t.statusLine}
        </span>
        <span className="card-actions">
          {t.verify && <VerifyBadge v={t.verify} />}
          {cancellable && (
            <button
              className="btn-mini"
              onClick={(e) => {
                e.stopPropagation();
                manager.cancel(t.id);
              }}
            >
              Cancel
            </button>
          )}
        </span>
      </div>
      {live && t.kind !== "patch" && <div className="card-progress" />}
    </div>
  );
}

function VerifyBadge({ v }: { v: NonNullable<Task["verify"]> }) {
  if (v.state === "pending") return <span className="badge badge-pending">verifying…</span>;
  if (v.state === "error") return <span className="badge badge-error" title="verify call failed">verify n/a</span>;
  const word = v.state === "ok" ? "verified" : v.state === "unsure" ? "unsure" : "mismatch";
  return (
    <span className={`badge badge-${v.state}`} title="screenshot checked against the request">
      {word} {v.score.toFixed(2)}
    </span>
  );
}

function OpsLog({ state }: { state: StudioState }) {
  const { ref, onScroll } = useStickToBottom(state.opsLog.length);
  return (
    <div className="opslog" ref={ref} onScroll={onScroll}>
      {state.opsLog.length === 0 && <p className="empty mono">no ops applied yet</p>}
      {state.opsLog.map((o) => (
        <div key={o.id} className={`op op-${o.kind}`}>
          <span className="op-time">{clock(o.at)}</span>
          <span className="op-text">{o.text}</span>
          {o.ms != null && <span className="op-ms">{fmtMs(o.ms)}</span>}
        </div>
      ))}
    </div>
  );
}

function clock(at: number) {
  const d = new Date(at);
  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
