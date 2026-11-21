import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
	DESIGNER_HINT_MS,
	type ShopGroup,
	type StudioState,
	type Task,
	type TaskManager,
} from "../lib/taskManager";
import type { Product } from "../types";
import { fmtMs } from "./Timeline";

export function Sidebar({
	state,
	manager,
}: {
	state: StudioState;
	manager: TaskManager;
}) {
	// short screens: the ops log starts collapsed so tasks and products get the room
	const [opsOpen, setOpsOpen] = useState(
		() => typeof window === "undefined" || window.innerHeight >= 860,
	);
	return (
		<aside className="sidebar">
			<section className="panel transcript-panel">
				<header className="panel-head">
					<h2>Transcript</h2>
					<span className="panel-meta">
						{state.transcript.filter((l) => l.kind === "user").length || ""}
					</span>
				</header>
				<Transcript state={state} />
			</section>

			<section className="panel tasks-panel">
				<header className="panel-head">
					<h2>Tasks</h2>
					<span className="panel-meta">
						{state.counters.running ? <span className="live-dot" /> : null}
						{state.counters.running
							? `${state.counters.running} running`
							: state.tasks.length
								? `${state.tasks.length}`
								: ""}
					</span>
				</header>
				<TaskList tasks={state.tasks} manager={manager} />
			</section>

			{state.shop.length > 0 && (
				<section
					className={`panel shop-panel ${state.shop.some((g) => g.products.length) ? "has-products" : ""}`}
				>
					<header className="panel-head">
						<h2>
							<i className="dot dot-source" /> Shop the look
						</h2>
						<span className="panel-meta">
							{state.shop.reduce((n, g) => n + g.products.length, 0) || ""}
						</span>
					</header>
					<div className="shop">
						{state.shop
							.slice()
							.reverse()
							.map((g) => (
								<ShopGroupView key={g.objectId} g={g} manager={manager} />
							))}
					</div>
				</section>
			)}

			<section className={`panel ops-panel ${opsOpen ? "open" : ""}`}>
				<header
					className="panel-head clickable"
					onClick={() => setOpsOpen((o) => !o)}
				>
					<h2>
						<span className={`caret ${opsOpen ? "open" : ""}`}>›</span> Scene
						ops
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
	const { ref, onScroll } = useStickToBottom(
		`${state.transcript.length}|${state.interim}`,
	);
	const statusOf = (taskId?: string) =>
		state.tasks.find((t) => t.id === taskId);
	const empty = state.transcript.length === 0 && !state.interim;
	return (
		<div className="transcript" ref={ref} onScroll={onScroll}>
			{empty && <p className="empty">No speech yet.</p>}
			{state.transcript.map((l) =>
				l.kind === "user" ? (
					<p
						key={l.id}
						className={`line line-user ${lineState(statusOf(l.taskId))}`}
					>
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
	const isLive = (t: Task) =>
		t.status === "running" || t.status === "held" || t.status === "queued";
	const anyRunning = tasks.some(isLive);
	useTick(anyRunning);
	const running = tasks
		.filter(isLive)
		.sort(
			(a, b) =>
				(a.status === "queued" ? 1 : 0) - (b.status === "queued" ? 1 : 0) ||
				b.startAt - a.startAt,
		);
	const rest = tasks
		.filter((t) => !isLive(t))
		.sort((a, b) => b.startAt - a.startAt)
		.slice(0, 60);
	if (!tasks.length)
		return (
			<div className="tasks">
				<p className="empty">Tasks you trigger show up here.</p>
			</div>
		);
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
	queued: "queued",
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
	const cancellable =
		t.status === "running" || t.status === "held" || t.status === "queued";
	const planning =
		t.kind === "patch" &&
		t.status === "running" &&
		performance.now() - t.startAt > DESIGNER_HINT_MS;
	const designer = t.kind === "patch" && (t.designer || planning);
	const focusable =
		!!t.targetId || (t.kind === "render" && t.status === "done");
	const statusLine = planning ? "designer is planning the room…" : t.statusLine;
	return (
		<div
			className={`card card-${t.kind} st-${t.status} ${designer ? "card-designer" : ""} ${planning ? "planning" : ""} ${focusable ? "focusable" : ""}`}
			onClick={() => manager.focus(t.id)}
			title={
				t.kind === "render"
					? t.status === "done"
						? "Show the render"
						: undefined
					: t.targetId
						? `Focus ${t.targetId}`
						: undefined
			}
		>
			<div className="card-top">
				<span
					className={`dot dot-${designer ? "designer" : t.kind} ${t.status === "running" ? "pulse" : ""}`}
				/>
				<span className="card-title">{title}</span>
				<span className="card-time">
					{t.status === "running"
						? fmtMs(performance.now() - t.startAt)
						: t.status === "queued"
							? "—"
							: t.ms != null
								? fmtMs(t.ms)
								: fmtMs(elapsed)}
				</span>
			</div>
			{t.kind === "patch" && t.designer && t.model && (
				<div className="card-designer-label">designer · {t.model}</div>
			)}
			{t.kind === "patch" && t.designer && (t.brief || t.say) && (
				<div className="card-brief">
					{t.brief && (
						<p className="brief" title={t.brief}>
							<b>brief</b> {t.brief}
						</p>
					)}
					{t.say && <p className="say">{t.say}</p>}
				</div>
			)}
			<div className="card-bottom">
				<span
					className={`card-status ${t.status === "failed" ? "bad" : ""}`}
					title={statusLine}
				>
					{STATUS_WORD[t.status] && (
						<em className={`tag tag-${t.status}`}>{STATUS_WORD[t.status]}</em>
					)}
					{(t.status === "running" && t.kind !== "patch") || planning ? (
						<span className="spinner" />
					) : null}
					{statusLine}
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
	if (v.state === "pending")
		return <span className="badge badge-pending">verifying…</span>;
	if (v.state === "error")
		return (
			<span className="badge badge-error" title="verify call failed">
				verify n/a
			</span>
		);
	const word =
		v.state === "ok"
			? "verified"
			: v.state === "unsure"
				? "unsure"
				: "mismatch";
	return (
		<span
			className={`badge badge-${v.state}`}
			title="screenshot checked against the request"
		>
			{word} {v.score.toFixed(2)}
		</span>
	);
}

function OpsLog({ state }: { state: StudioState }) {
	const { ref, onScroll } = useStickToBottom(state.opsLog.length);
	return (
		<div className="opslog" ref={ref} onScroll={onScroll}>
			{state.opsLog.length === 0 && (
				<p className="empty mono">no ops applied yet</p>
			)}
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

// ---------- Shop the look ----------
// Everything in a Product is untrusted text from the web: rendered as text only, links limited to http(s).
function safeHttp(u: unknown): string | null {
	if (typeof u !== "string" || !u.trim()) return null;
	try {
		const url = new URL(u.trim());
		return url.protocol === "http:" || url.protocol === "https:"
			? url.href
			: null;
	} catch {
		return null;
	}
}

function ShopGroupView({ g, manager }: { g: ShopGroup; manager: TaskManager }) {
	return (
		<div className={`shop-group shop-${g.status}`}>
			<div className="shop-group-head">
				<span className="shop-name">{g.name}</span>
				{g.status === "running" && (
					<span className="shop-status">
						<span className="spinner" />
						{g.statusLine}
					</span>
				)}
				{g.status === "failed" && (
					<span className="shop-status bad">no products · {g.statusLine}</span>
				)}
				{g.status === "cancelled" && (
					<span className="shop-status">cancelled</span>
				)}
				{g.status === "done" && g.model && (
					<span className="shop-status">{g.model}</span>
				)}
				{g.status === "running" && (
					<button className="btn-mini" onClick={() => manager.cancel(g.taskId)}>
						Cancel
					</button>
				)}
			</div>
			{g.products.length > 0 && (
				<div className="shop-items">
					{g.products.map((p, i) => (
						<ProductCard key={i} p={p} />
					))}
				</div>
			)}
		</div>
	);
}

function ProductCard({ p }: { p: Product }) {
	const href = safeHttp(p.url);
	const img = safeHttp(p.image_url);
	const [stage, setStage] = useState<0 | 1 | 2>(img ? 0 : 2); // 0 proxy, 1 direct, 2 placeholder
	const src = img
		? stage === 0
			? `/api/img?u=${encodeURIComponent(img)}`
			: stage === 1
				? img
				: null
		: null;
	const title = String(p.title ?? "").slice(0, 200);
	const body = (
		<>
			<span className="product-img">
				{src ? (
					<img
						src={src}
						alt=""
						loading="lazy"
						referrerPolicy="no-referrer"
						onError={() => setStage((s) => (s === 0 ? 1 : 2))}
					/>
				) : (
					<span className="product-ph" aria-hidden>
						<svg width="22" height="22" viewBox="0 0 24 24">
							<path
								d="M4 19V9l8-5 8 5v10H4Z"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinejoin="round"
							/>
						</svg>
					</span>
				)}
			</span>
			<span className="product-title" title={title}>
				{title || "Product"}
			</span>
			<span className="product-meta">
				<b>{String(p.price ?? "").slice(0, 40)}</b>
				<span>{String(p.store ?? "").slice(0, 60)}</span>
			</span>
		</>
	);
	return href ? (
		<a
			className="product"
			href={href}
			target="_blank"
			rel="noopener noreferrer"
		>
			{body}
		</a>
	) : (
		<div className="product product-nolink">{body}</div>
	);
}
