// Client-side orchestration. Framework-light: React (and the timeline canvas) subscribe to it.
//
// Ordering: every dispatched utterance gets a sequence number. Patch calls run concurrently, but their ops
// are applied strictly in sequence order: a response that arrives early is parked in `ready` until all earlier
// patches have been applied, failed or been cancelled.
//
// Background jobs (asset / decal) start the instant their parent patch *returns* (so the timeline hand-off is
// exact) but only touch the engine after the parent's ops have been applied (`applied` promise).
import type { Api } from "./api";
import type {
  AssetEvent,
  Engine,
  HistoryItem,
  Job,
  Op,
  PatchResponse,
  Product,
  Scene,
  SourceEvent,
} from "../types";

/** Engine extras the real engine (scene/engine.ts StudioEngine) has; mocks may lack them. */
type EngineExtras = {
  setAssetCode(objectId: string, code: string, description?: string): { ok: boolean; error?: string };
  getAssetCode?(objectId: string): string | undefined;
  setScene?(scene: Scene): void;
  resetView?(): void;
};

export type ShopGroup = {
  objectId: string;
  name: string;
  taskId: string;
  status: "running" | "done" | "failed" | "cancelled";
  statusLine: string;
  model?: string;
  products: Product[];
};

const URL_PARAMS = new URLSearchParams(typeof location !== "undefined" ? location.search : "");

export type TaskKind = "patch" | "asset" | "decal" | "source";
export type TaskStatus = "running" | "held" | "done" | "nochange" | "failed" | "cancelled" | "superseded";
export type VerifyState =
  | { state: "pending" }
  | { state: "ok" | "unsure" | "mismatch"; score: number }
  | { state: "error" };

export type Task = {
  id: string;
  kind: TaskKind;
  title: string;
  seq?: number; // patch only
  utterance?: string; // patch only
  parentId?: string; // jobs: the patch that spawned them
  targetId?: string; // what clicking the card focuses
  startAt: number; // performance.now()
  endAt?: number; // when the line returns to the baseline (network return)
  status: TaskStatus;
  statusLine: string;
  error?: string;
  ms?: number;
  lane: number;
  verify?: VerifyState;
  opsCount?: number;
  claim?: string;
  model?: string; // patch: which model answered (orchestrator or designer)
};

export type TranscriptLine =
  | { id: string; kind: "user"; text: string; at: number; taskId?: string }
  | { id: string; kind: "say"; text: string; at: number; taskId?: string };

export type OpLogEntry = { id: string; at: number; text: string; ms?: number; kind: TaskKind | "undo" };

export type StudioState = {
  tasks: Task[];
  transcript: TranscriptLine[];
  interim: string;
  opsLog: OpLogEntry[];
  verifyEnabled: boolean;
  clockStart: number | null;
  counters: { objects: number; decals: number; done: number; failed: number; running: number };
  patchMs: number[]; // completed patch latencies, oldest first
  shopEnabled: boolean;
  shop: ShopGroup[];
};

type Internal = {
  task: Task;
  abort: AbortController;
  // patch only
  applied?: Promise<boolean>;
  resolveApplied?: (ok: boolean) => void;
  children?: string[];
};

const now = () => performance.now();
let idCounter = 0;
const uid = (p: string) => `${p}${++idCounter}`;

export function summarizeOp(op: Op): string {
  const r = (n: number) => (Math.round(n * 100) / 100).toString();
  switch (op.op) {
    case "add": {
      const o = op.object;
      const desc = o.shape === "custom" && o.description ? ` "${o.description.slice(0, 40)}"` : "";
      return `add ${op.id} ${o.shape}${desc} @(${r(o.position.x)},${r(o.position.y)},${r(o.position.z)})`;
    }
    case "update":
      return `update ${op.id} ${compact(op.changes)}`;
    case "remove":
      return `remove ${op.id}`;
    case "surface":
      return `surface ${op.id} ${compact(op.changes)}`;
    case "add_decal":
      return `add_decal ${op.id} on ${op.decal.surface} ${r(op.decal.width)}×${r(op.decal.height)}m`;
    case "update_decal":
      return `update_decal ${op.id} ${compact(op.changes)}`;
    case "remove_decal":
      return `remove_decal ${op.id}`;
  }
}

function compact(v: unknown): string {
  let s = "";
  try {
    s = JSON.stringify(v, (_k, val) => (typeof val === "number" ? Math.round(val * 100) / 100 : val));
  } catch {
    s = String(v);
  }
  s = s.replace(/"([a-z_]+)":/gi, "$1:").replace(/[{}]/g, "").replace(/,/g, " ");
  return s.length > 64 ? s.slice(0, 63) + "…" : s;
}

function opTarget(op: Op): string | undefined {
  return op.id;
}

export class TaskManager {
  private engine: Engine | null = null;
  private api: Api | null;
  private listeners = new Set<() => void>();
  private snapshot: StudioState;
  private internals = new Map<string, Internal>();
  private tasks: Task[] = [];
  private transcript: TranscriptLine[] = [];
  private interim = "";
  private opsLog: OpLogEntry[] = [];
  private verifyEnabled = true;
  private clockStart: number | null = null;
  private patchMs: number[] = [];
  private history: HistoryItem[] = [];
  private assetCode = new Map<string, string>();
  private activeJob = new Map<string, string>(); // "asset:<id>" | "decal:<id>" -> taskId
  private seqCounter = 0;
  private nextToApply = 1;
  private settled = new Map<number, { taskId: string; res: PatchResponse | null }>();
  private sceneCounts = { objects: 0, decals: 0 };
  private unsubEngine: (() => void) | null = null;
  private emitQueued = false;
  private shopEnabled = URL_PARAMS.get("shop") !== "0";
  private shop: ShopGroup[] = [];
  private shopSeen = new Set<string>(); // objectIds whose group has seen its object in the scene
  private initialScene: Scene | null = null;
  private shotCheap = URL_PARAMS.get("shot") !== "0";
  private shotSlow = 0;

  constructor(api: Api | null = null) {
    this.api = api;
    this.snapshot = this.buildSnapshot();
  }

  // ---------- wiring ----------
  setApi(api: Api) {
    this.api = api;
  }

  attachEngine(engine: Engine | null) {
    this.unsubEngine?.();
    this.unsubEngine = null;
    this.engine = engine;
    if (engine) {
      const s0 = engine.getScene();
      if (!this.initialScene) this.initialScene = s0;
      this.countScene(s0);
      this.unsubEngine = engine.subscribe((s) => {
        this.countScene(s);
        this.pruneShop(s);
        this.emit();
      });
    }
    this.emit();
  }

  private countScene(s: Scene) {
    this.sceneCounts = { objects: s.objects.length, decals: s.decals.length };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snapshot;

  /** Live task list for the rAF-driven timeline (no React round-trip). */
  liveTasks(): readonly Task[] {
    return this.tasks;
  }

  getClockStart() {
    return this.clockStart;
  }

  startClock() {
    if (this.clockStart == null) {
      this.clockStart = now();
      this.emit();
    }
  }

  private emit() {
    if (this.emitQueued) return;
    this.emitQueued = true;
    queueMicrotask(() => {
      this.emitQueued = false;
      this.snapshot = this.buildSnapshot();
      for (const l of this.listeners) l();
    });
  }

  private buildSnapshot(): StudioState {
    const tasks = this.tasks.map((t) => ({ ...t }));
    const done = tasks.filter((t) => t.status === "done" || t.status === "nochange").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    const running = tasks.filter((t) => t.status === "running" || t.status === "held").length;
    return {
      tasks,
      transcript: this.transcript.slice(),
      interim: this.interim,
      opsLog: this.opsLog.slice(),
      verifyEnabled: this.verifyEnabled,
      clockStart: this.clockStart,
      counters: { ...this.sceneCounts, done, failed, running },
      patchMs: this.patchMs.slice(),
      shopEnabled: this.shopEnabled,
      shop: this.shop.map((g) => ({ ...g, products: g.products.slice() })),
    };
  }

  private update(id: string, patch: Partial<Task>) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, patch);
    this.emit();
  }

  /** Lowest lane not used by a running task (and not in `exclude`). */
  private allocLane(exclude: number[] = []): number {
    const busy = new Set(exclude);
    for (const t of this.tasks) if (t.endAt == null) busy.add(t.lane);
    let lane = 0;
    while (busy.has(lane)) lane++;
    return lane;
  }

  private addTask(t: Omit<Task, "lane">, excludeLanes: number[] = []): Task {
    const task: Task = { ...t, lane: this.allocLane(excludeLanes) };
    this.tasks.push(task);
    if (this.tasks.length > 200) this.tasks.splice(0, this.tasks.length - 200);
    this.emit();
    return task;
  }

  private log(kind: OpLogEntry["kind"], text: string, ms?: number) {
    this.opsLog.push({ id: uid("log"), at: Date.now(), text, ms, kind });
    if (this.opsLog.length > 300) this.opsLog.splice(0, this.opsLog.length - 300);
  }

  // ---------- transcript ----------
  setInterim(text: string) {
    this.interim = text;
    this.emit();
  }

  /** A finished utterance from voice (or the text box). */
  utterance(text: string) {
    const clean = text.trim();
    this.interim = "";
    if (!clean) {
      this.emit();
      return;
    }
    this.dispatch(clean);
  }

  setShopEnabled(on: boolean) {
    this.shopEnabled = on;
    this.emit();
  }

  /** "New room": cancel everything, clear tasks/transcript/log/history, put the default scene back. */
  newRoom() {
    for (const t of this.tasks.slice()) if (t.status === "running" || t.status === "held") this.cancel(t.id);
    this.tasks = [];
    this.transcript = [];
    this.interim = "";
    this.opsLog = [];
    this.history = [];
    this.patchMs = [];
    this.shop = [];
    this.shopSeen.clear();
    this.activeJob.clear();
    this.internals.clear();
    this.clockStart = null;
    const e = this.engine as (Engine & Partial<EngineExtras>) | null;
    if (e && this.initialScene) {
      try {
        if (e.setScene) e.setScene(this.initialScene);
        e.resetView?.();
      } catch (err) {
        console.warn("[studio] new room failed", err);
      }
    }
    this.emit();
  }

  setVerifyEnabled(on: boolean) {
    this.verifyEnabled = on;
    this.emit();
  }

  undo(): boolean {
    if (!this.engine) return false;
    const ok = this.engine.undo();
    if (ok) {
      this.log("undo", "undo  ← restored previous scene");
      this.emit();
    }
    return ok;
  }

  focus(taskId: string) {
    const t = this.tasks.find((x) => x.id === taskId);
    if (t?.targetId && this.engine) {
      try {
        this.engine.focus(t.targetId);
      } catch {
        /* ignore */
      }
    }
  }

  // ---------- dispatch / patch ----------
  dispatch(utterance: string): string {
    this.startClock();
    const seq = ++this.seqCounter;
    const abort = new AbortController();
    const task = this.addTask({
      id: uid("p"),
      kind: "patch",
      title: utterance,
      seq,
      utterance,
      startAt: now(),
      status: "running",
      statusLine: "orchestrator thinking…",
    });
    let resolveApplied!: (ok: boolean) => void;
    const applied = new Promise<boolean>((r) => (resolveApplied = r));
    this.internals.set(task.id, { task, abort, applied, resolveApplied, children: [] });
    this.transcript.push({ id: uid("l"), kind: "user", text: utterance, at: Date.now(), taskId: task.id });
    this.emit();

    const scene = this.engine ? this.engine.getScene() : null;
    const history = this.history.slice(-6);
    const api = this.api;
    if (!scene || !api) {
      this.failPatch(task.id, seq, "engine not ready");
      return task.id;
    }
    // PatchRequest.image: a canvas screenshot, only while it stays cheap (< 50 ms); ?shot=0 disables it.
    let image: string | undefined;
    if (this.shotCheap && this.engine) {
      const t0 = now();
      try {
        image = this.engine.screenshot() || undefined;
      } catch {
        image = undefined;
      }
      const dt = now() - t0;
      if (dt > 50) {
        this.shotSlow++;
        if (this.shotSlow >= 2) this.shotCheap = false; // one slow frame can be a hiccup; two means skip it
        image = undefined;
      }
    }
    api
      .patch({ scene, history, utterance, ...(image ? { image } : {}) }, abort.signal)
      .then((res) => this.onPatchReturn(task.id, seq, res))
      .catch((err: unknown) => {
        if (abort.signal.aborted) return; // cancel() already settled it
        this.failPatch(task.id, seq, errMsg(err));
      });
    return task.id;
  }

  private onPatchReturn(taskId: string, seq: number, res: PatchResponse) {
    const t = this.tasks.find((x) => x.id === taskId);
    if (!t || t.status !== "running") return;
    const end = now();
    const ms = Math.round(end - t.startAt);
    const ops = Array.isArray(res.ops) ? res.ops : [];
    const jobs = Array.isArray(res.jobs) ? res.jobs : [];
    const waiting = seq !== this.nextToApply;
    this.update(taskId, {
      endAt: end,
      ms,
      opsCount: ops.length,
      status: waiting ? "held" : t.status,
      statusLine: waiting ? `holding ${ops.length} op${ops.length === 1 ? "" : "s"} for earlier command` : "applying",
      targetId: pickTarget(ops),
      model: res.model || undefined,
    });
    this.patchMs.push(ms);
    if (res.say && res.say.trim()) {
      // put the assistant line right under its utterance
      const idx = this.transcript.findIndex((l) => l.taskId === taskId && l.kind === "user");
      const line: TranscriptLine = { id: uid("l"), kind: "say", text: res.say.trim(), at: Date.now(), taskId };
      if (idx >= 0) {
        let at = idx + 1;
        while (at < this.transcript.length && this.transcript[at].kind === "say" && this.transcript[at].taskId === taskId) at++;
        this.transcript.splice(at, 0, line);
      } else this.transcript.push(line);
    }
    // hand-off: jobs drop from this exact return point
    const parentLane = t.lane;
    for (const job of jobs) this.startJob(job, taskId, end, parentLane, ops);
    this.settled.set(seq, { taskId, res: { ...res, ops, jobs } });
    this.flush();
  }

  private failPatch(taskId: string, seq: number, error: string, status: TaskStatus = "failed") {
    const t = this.tasks.find((x) => x.id === taskId);
    if (t && (t.status === "running" || t.status === "held")) {
      this.update(taskId, {
        status,
        endAt: t.endAt ?? now(),
        ms: t.ms ?? Math.round(now() - t.startAt),
        statusLine: status === "cancelled" ? "cancelled" : error,
        error: status === "failed" ? error : undefined,
      });
    }
    this.settled.set(seq, { taskId, res: null });
    this.flush();
  }

  /** Apply settled patches strictly in sequence order. */
  private flush() {
    while (this.settled.has(this.nextToApply)) {
      const { taskId, res } = this.settled.get(this.nextToApply)!;
      this.settled.delete(this.nextToApply);
      this.nextToApply++;
      const internal = this.internals.get(taskId);
      const t = this.tasks.find((x) => x.id === taskId);
      if (!res || !t || (t.status !== "running" && t.status !== "held")) {
        internal?.resolveApplied?.(false);
        continue;
      }
      let ok = true;
      if (res.ops.length && this.engine) {
        try {
          this.engine.applyOps(res.ops);
        } catch (err) {
          ok = false;
          this.update(taskId, { status: "failed", statusLine: `applyOps: ${errMsg(err)}`, error: errMsg(err) });
        }
      }
      if (ok) {
        const summary = res.ops.map(summarizeOp);
        for (const s of summary) this.log("patch", s, t.ms);
        this.history.push({ u: t.utterance ?? "", applied: summary.length ? summary.join("; ").slice(0, 400) : "(no change)" });
        if (this.history.length > 30) this.history.splice(0, this.history.length - 30);
        const n = res.ops.length;
        this.update(taskId, {
          status: n ? "done" : "nochange",
          statusLine: n
            ? `${n} op${n === 1 ? "" : "s"} applied · ${res.model || "orchestrator"}`
            : res.say?.trim() || "no change",
        });
        // Patches that hand off jobs are verified when the job lands (a placeholder would score low).
        if (n && !res.jobs.length) this.verify(taskId, t.utterance ?? "");
      }
      internal?.resolveApplied?.(ok);
    }
    // anything still parked keeps showing "held"
    this.emit();
  }

  // ---------- background jobs ----------
  private startJob(job: Job, parentId: string, at: number, parentLane: number, ops: Op[]) {
    const parent = this.internals.get(parentId);
    const key = job.kind === "asset" ? `asset:${job.objectId}` : `decal:${job.decalId}`;
    const prev = this.activeJob.get(key);
    if (prev) this.supersede(prev);

    const abort = new AbortController();
    const task = this.addTask(
      {
        id: uid(job.kind === "asset" ? "a" : "d"),
        kind: job.kind,
        title: job.kind === "asset" ? `Build: ${job.name}` : `Image: ${decalName(job, ops, this.engine)}`,
        parentId,
        targetId: job.kind === "asset" ? job.objectId : job.decalId,
        startAt: at,
        status: "running",
        statusLine: job.kind === "asset" ? "dispatching to managed agent…" : "generating image…",
        claim:
          job.kind === "asset"
            ? `a ${job.name}: ${job.description}`
            : `an image on the wall showing: ${job.prompt}`,
      },
      [parentLane],
    );
    this.internals.set(task.id, { task, abort });
    parent?.children?.push(task.id);
    this.activeJob.set(key, task.id);

    const applied = parent?.applied ?? Promise.resolve(true);
    if (job.kind === "asset") this.runAsset(task.id, job, abort, applied, key);
    else this.runDecal(task.id, job, abort, applied, key);

    // Shop the look: only for a NEWLY ADDED custom object (not rebuilds / moves / recolours).
    if (
      job.kind === "asset" &&
      this.shopEnabled &&
      this.api?.source &&
      ops.some((op) => op.op === "add" && op.id === job.objectId) &&
      !this.shop.some((g) => g.objectId === job.objectId)
    ) {
      this.startSource(job, parentId, at, parentLane, applied);
    }
  }

  private startSource(job: Extract<Job, { kind: "asset" }>, parentId: string, at: number, parentLane: number, applied: Promise<boolean>) {
    const parent = this.internals.get(parentId);
    const abort = new AbortController();
    const task = this.addTask(
      {
        id: uid("s"),
        kind: "source",
        title: `Shop: ${job.name}`,
        parentId,
        targetId: job.objectId,
        startAt: at,
        status: "running",
        statusLine: "dispatching sourcing agent…",
      },
      [parentLane],
    );
    this.internals.set(task.id, { task, abort });
    parent?.children?.push(task.id);
    const group: ShopGroup = { objectId: job.objectId, name: job.name, taskId: task.id, status: "running", statusLine: "searching…", products: [] };
    this.shop.push(group);
    this.emit();
    void this.runSource(task.id, group, job, abort, applied);
  }

  private async runSource(
    taskId: string,
    group: ShopGroup,
    job: Extract<Job, { kind: "asset" }>,
    abort: AbortController,
    applied: Promise<boolean>,
  ) {
    let products: Product[] | null = null;
    let errorMsg: string | null = null;
    let model = "";
    try {
      if (!this.api?.source) throw new Error("sourcing not available");
      await this.api.source({ objectId: job.objectId, name: job.name, description: job.description }, abort.signal, (e: SourceEvent) => {
        if (!this.isLive(taskId)) return;
        if (e.type === "status") {
          group.statusLine = e.text;
          this.update(taskId, { statusLine: e.text });
        } else if (e.type === "done") {
          products = Array.isArray(e.products) ? e.products : [];
          model = e.model || "";
        } else if (e.type === "error") errorMsg = e.message || "sourcing error";
      });
    } catch (err) {
      if (abort.signal.aborted) return;
      errorMsg = errMsg(err);
    }
    if (!this.isLive(taskId)) return;
    const end = now();
    const t = this.tasks.find((x) => x.id === taskId)!;
    const ms = Math.round(end - t.startAt);
    const parentOk = await applied;
    if (!this.isLive(taskId)) return;
    const found = (products ?? []) as Product[];
    if (!parentOk) {
      this.update(taskId, { status: "cancelled", endAt: end, ms, statusLine: "parent command did not apply" });
      this.shop = this.shop.filter((g) => g !== group);
    } else if (errorMsg || !found.length) {
      const msg = errorMsg ?? "no products found";
      group.status = "failed";
      group.statusLine = msg;
      this.update(taskId, { status: "failed", endAt: end, ms, statusLine: msg, error: msg });
      this.log("source", `shop ${job.objectId} FAILED: ${msg}`, ms);
    } else {
      group.status = "done";
      group.products = found.slice(0, 3);
      group.statusLine = "";
      group.model = model;
      this.update(taskId, {
        status: "done",
        endAt: end,
        ms,
        statusLine: `${group.products.length} product${group.products.length === 1 ? "" : "s"} found${model ? ` · ${model}` : ""}`,
      });
      this.log("source", `shop ${job.objectId}: ${group.products.length} products${model ? ` (${model})` : ""}`, ms);
    }
    this.emit();
  }

  /** Drop product groups whose object has left the scene (only after it was seen there once). */
  private pruneShop(s: Scene) {
    if (!this.shop.length) return;
    const ids = new Set(s.objects.map((o) => o.id));
    for (const g of this.shop.slice()) {
      if (ids.has(g.objectId)) {
        this.shopSeen.add(g.objectId);
        continue;
      }
      if (!this.shopSeen.has(g.objectId)) continue;
      this.shopSeen.delete(g.objectId);
      this.shop = this.shop.filter((x) => x !== g);
      const t = this.tasks.find((x) => x.id === g.taskId);
      if (t && t.status === "running") {
        const end = now();
        this.update(t.id, { status: "cancelled", endAt: end, ms: Math.round(end - t.startAt), statusLine: "object removed" });
        this.internals.get(t.id)?.abort.abort();
      }
    }
  }

  private supersede(taskId: string) {
    const t = this.tasks.find((x) => x.id === taskId);
    const internal = this.internals.get(taskId);
    if (!t || t.endAt != null) return;
    this.update(taskId, { status: "superseded", endAt: now(), ms: Math.round(now() - t.startAt), statusLine: "superseded by a newer request" });
    internal?.abort.abort();
  }

  private finishJob(key: string, taskId: string) {
    if (this.activeJob.get(key) === taskId) this.activeJob.delete(key);
  }

  private isLive(taskId: string) {
    const t = this.tasks.find((x) => x.id === taskId);
    return !!t && t.status === "running";
  }

  private async runAsset(
    taskId: string,
    job: Extract<Job, { kind: "asset" }>,
    abort: AbortController,
    applied: Promise<boolean>,
    key: string,
  ) {
    const ex = this.engine as (Engine & Partial<EngineExtras>) | null;
    const currentCode = ex?.getAssetCode?.(job.objectId) ?? this.assetCode.get(job.objectId);
    let doneEvent: Extract<AssetEvent, { type: "done" }> | null = null;
    let errorMsg: string | null = null;
    let statusCount = 0;
    try {
      if (!this.api) throw new Error("api not ready");
      await this.api.asset(
        { objectId: job.objectId, name: job.name, description: job.description, size: job.size, ...(currentCode ? { currentCode } : {}) },
        abort.signal,
        (e) => {
          if (!this.isLive(taskId)) return;
          if (e.type === "status") {
            statusCount++;
            this.update(taskId, { statusLine: e.text });
          } else if (e.type === "done") doneEvent = e;
          else if (e.type === "error") errorMsg = e.message || "agent error";
        },
      );
    } catch (err) {
      if (abort.signal.aborted) {
        this.finishJob(key, taskId);
        return; // cancel/supersede already handled UI
      }
      errorMsg = errMsg(err);
    }
    if (!this.isLive(taskId)) {
      this.finishJob(key, taskId);
      return;
    }
    const end = now();
    const t = this.tasks.find((x) => x.id === taskId)!;
    const ms = Math.round(end - t.startAt);
    const done = doneEvent as Extract<AssetEvent, { type: "done" }> | null;
    if (!done && !errorMsg) errorMsg = "stream ended without a model";
    // engine changes wait for the parent's ops
    const parentOk = await applied;
    if (!this.isLive(taskId)) {
      this.finishJob(key, taskId);
      return;
    }
    if (!parentOk) {
      this.update(taskId, { status: "cancelled", endAt: end, ms, statusLine: "parent command did not apply" });
      this.finishJob(key, taskId);
      return;
    }
    if (errorMsg || !done) {
      this.safe(() => this.engine?.setAssetFailed(job.objectId));
      this.update(taskId, { status: "failed", endAt: end, ms, statusLine: errorMsg ?? "failed", error: errorMsg ?? "failed" });
      this.log("asset", `asset ${job.objectId} FAILED: ${errorMsg}`, ms);
      this.finishJob(key, taskId);
      return;
    }
    let result: { ok: boolean; error?: string } = { ok: false, error: "engine not ready" };
    try {
      if (this.engine) result = (this.engine as Engine & EngineExtras).setAssetCode(job.objectId, done.code, job.description);
    } catch (err) {
      result = { ok: false, error: errMsg(err) };
    }
    if (!result.ok) {
      this.safe(() => this.engine?.setAssetFailed(job.objectId));
      const msg = `model rejected: ${result.error ?? "unknown error"}`;
      this.update(taskId, { status: "failed", endAt: end, ms, statusLine: msg, error: msg });
      this.log("asset", `asset ${job.objectId} REJECTED: ${result.error ?? ""}`, ms);
    } else if (this.isStale(job.objectId, job.description)) {
      // the object changed (undo / newer request) while this was building: the engine cached it but shows the current one
      const lines = done.code.split("\n").length;
      this.update(taskId, { status: "done", endAt: end, ms, statusLine: `model cached, not shown (object changed since) · ${lines} lines` });
      this.log("asset", `cached ${job.objectId} (stale, ${lines} lines, ${done.via})`, ms);
    } else {
      this.assetCode.set(job.objectId, done.code);
      const lines = done.code.split("\n").length;
      this.update(taskId, {
        status: "done",
        endAt: end,
        ms,
        statusLine: `model ready · ${lines} lines · ${done.via}${statusCount ? ` · ${statusCount} steps` : ""}`,
      });
      this.log("asset", `setAssetCode ${job.objectId} (${lines} lines, ${done.via})`, ms);
      this.verify(taskId, t.claim ?? job.name);
    }
    this.finishJob(key, taskId);
  }

  private async runDecal(
    taskId: string,
    job: Extract<Job, { kind: "decal" }>,
    abort: AbortController,
    applied: Promise<boolean>,
    key: string,
  ) {
    let dataUrl: string | null = null;
    let errorMsg: string | null = null;
    let model = "";
    try {
      if (!this.api) throw new Error("api not ready");
      const res = await this.api.decal(
        { decalId: job.decalId, prompt: job.prompt, width: job.width, height: job.height },
        abort.signal,
      );
      dataUrl = res.dataUrl;
      model = res.model;
      if (!dataUrl) errorMsg = "empty image";
    } catch (err) {
      if (abort.signal.aborted) {
        this.finishJob(key, taskId);
        return;
      }
      errorMsg = errMsg(err);
    }
    if (!this.isLive(taskId)) {
      this.finishJob(key, taskId);
      return;
    }
    const t = this.tasks.find((x) => x.id === taskId)!;
    const end = now();
    const ms = Math.round(end - t.startAt);
    const parentOk = await applied;
    if (!this.isLive(taskId)) {
      this.finishJob(key, taskId);
      return;
    }
    if (!parentOk) {
      this.update(taskId, { status: "cancelled", endAt: end, ms, statusLine: "parent command did not apply" });
    } else if (errorMsg || !dataUrl) {
      this.safe(() => this.engine?.setDecalFailed(job.decalId));
      this.update(taskId, { status: "failed", endAt: end, ms, statusLine: errorMsg ?? "failed", error: errorMsg ?? "failed" });
      this.log("decal", `decal ${job.decalId} FAILED: ${errorMsg}`, ms);
    } else {
      this.safe(() => this.engine?.setDecalImage(job.decalId, dataUrl!));
      this.update(taskId, { status: "done", endAt: end, ms, statusLine: `image ready${model ? ` · ${model}` : ""}` });
      this.log("decal", `setDecalImage ${job.decalId}`, ms);
      this.verify(taskId, t.claim ?? job.prompt);
    }
    this.finishJob(key, taskId);
  }

  private isStale(objectId: string, description: string): boolean {
    try {
      const o = this.engine?.getScene().objects.find((x) => x.id === objectId);
      return !!o && (o.description ?? "") !== description;
    } catch {
      return false;
    }
  }

  private safe(fn: () => void) {
    try {
      fn();
    } catch (err) {
      console.warn("[studio] engine call failed", err);
    }
  }

  // ---------- cancel ----------
  cancel(taskId: string) {
    const t = this.tasks.find((x) => x.id === taskId);
    const internal = this.internals.get(taskId);
    if (!t || !internal || (t.status !== "running" && t.status !== "held")) return;
    if (t.kind === "patch") {
      internal.abort.abort();
      // abort jobs it already spawned
      for (const c of internal.children ?? []) this.cancel(c);
      this.failPatch(taskId, t.seq!, "cancelled", "cancelled");
      return;
    }
    const end = now();
    this.update(taskId, { status: "cancelled", endAt: end, ms: Math.round(end - t.startAt), statusLine: "cancelled" });
    internal.abort.abort();
    if (t.kind === "asset" && t.targetId) this.safe(() => this.engine?.setAssetFailed(t.targetId!));
    if (t.kind === "decal" && t.targetId) this.safe(() => this.engine?.setDecalFailed(t.targetId!));
    if (t.kind === "source") {
      const g = this.shop.find((x) => x.taskId === taskId);
      if (g) {
        g.status = "cancelled";
        g.statusLine = "cancelled";
      }
      this.emit();
      return;
    }
    const key = `${t.kind}:${t.targetId}`;
    this.finishJob(key, taskId);
  }

  // ---------- verify ----------
  private verify(taskId: string, claim: string) {
    if (!this.verifyEnabled || !this.engine || !this.api) return;
    const api = this.api;
    this.update(taskId, { verify: { state: "pending" } });
    const engine = this.engine;
    void (async () => {
      try {
        await new Promise((r) => setTimeout(r, 500));
        const image = engine.screenshot();
        const res = await api.verify({ image, claims: [{ key: taskId, text: claim }] });
        const r = res?.results?.[taskId];
        if (!r || typeof r.yes !== "number") throw new Error("no result");
        const score = Math.max(0, Math.min(1, r.yes));
        // yes >= 0.5 is the cutoff; scores are soft (true claims ~0.6), so only very low scores read as mismatch.
        const state = score >= 0.5 ? "ok" : score >= 0.25 ? "unsure" : "mismatch";
        this.update(taskId, { verify: { state, score } });
      } catch {
        this.update(taskId, { verify: { state: "error" } });
      }
    })();
  }
}

function pickTarget(ops: Op[]): string | undefined {
  // Prefer something visible: last added object/decal, else last touched thing.
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    if (op.op === "add" || op.op === "add_decal") return op.id;
  }
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    if (op.op !== "remove" && op.op !== "remove_decal") return opTarget(op);
  }
  return undefined;
}

function decalName(job: Extract<Job, { kind: "decal" }>, ops: Op[], engine: Engine | null) {
  let name = "";
  for (const op of ops) if (op.op === "add_decal" && op.id === job.decalId) name = op.decal.name;
  if (!name && engine) {
    try {
      name = engine.getScene().decals.find((d) => d.id === job.decalId)?.name ?? "";
    } catch {
      /* ignore */
    }
  }
  const s = (name || job.prompt).trim().replace(/\s+/g, " ");
  return s.length > 38 ? s.slice(0, 37) + "…" : s;
}

function errMsg(err: unknown): string {
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) return "server unreachable";
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}

