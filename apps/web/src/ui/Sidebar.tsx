import { Badge } from "@gemini-hack/ui/components/badge";
import { Button } from "@gemini-hack/ui/components/button";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { House } from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	DESIGNER_HINT_MS,
	type ShopGroup,
	type StudioState,
	type Task,
	type TaskManager,
} from "../lib/taskManager";
import type { Product } from "../types";
import { Dot, surface } from "./parts";
import { fmtMs } from "./Timeline";

const scroller =
	"min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgb(0_0_0/0.12)_transparent] [scrollbar-width:thin]";
const empty = "text-sm text-muted-foreground";

function PanelHead({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
	return (
		<div className="flex flex-none items-center gap-2 px-5 pt-4.5 pb-3">
			<h2 className="flex items-center gap-2 text-xl leading-[22px] font-semibold tracking-[-1px]">
				{title}
			</h2>
			{meta ? (
				<span className="text-muted-foreground flex items-center gap-1.5 text-sm font-semibold">
					{meta}
				</span>
			) : null}
		</div>
	);
}

/** Right column of the studio: products to buy for the room, then the work in flight. */
export function Sidebar({
	state,
	manager,
}: {
	state: StudioState;
	manager: TaskManager;
}) {
	const productCount = state.shop.reduce((n, g) => n + g.products.length, 0);
	return (
		<aside className="flex min-h-0 w-full min-w-0 flex-col gap-3">
			{state.shop.length > 0 && (
				<section
					aria-label="Shop the look"
					className={cn(
						surface,
						"flex min-h-0 flex-col",
						productCount ? "flex-[1.2_1_0]" : "flex-none",
					)}
				>
					<PanelHead title="Shop the look" meta={productCount || ""} />
					<div className={cn(scroller, "flex flex-col gap-4 px-4 pb-4")}>
						{state.shop
							.slice()
							.reverse()
							.map((g) => (
								<ShopGroupView key={g.objectId} g={g} manager={manager} />
							))}
					</div>
				</section>
			)}

			<section
				aria-label="Tasks"
				className={cn(surface, "flex min-h-40 flex-[1_1_0] flex-col")}
			>
				<PanelHead
					title="Tasks"
					meta={
						state.counters.running ? (
							<Badge className="bg-primary/10 text-primary h-6 gap-1.5 rounded-full px-2.5 text-xs font-semibold">
								<Dot agent="asset" pulse />
								{state.counters.running} running
							</Badge>
						) : (
							state.tasks.length || ""
						)
					}
				/>
				<TaskList tasks={state.tasks} manager={manager} />
			</section>
		</aside>
	);
}

export function Counter({
	n,
	label,
	bad,
}: {
	n: number;
	label: string;
	bad?: boolean;
}) {
	return (
		<span className={cn(bad && n > 0 && "text-bad font-semibold")}>
			<b className="text-foreground mr-1 font-semibold">{n}</b>
			{label}
		</span>
	);
}

function useStickToBottom(dep: unknown) {
	const ref = useRef<HTMLDivElement>(null);
	const stick = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: dep is the trigger, not read inside
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

const rise = "animate-in fade-in slide-in-from-bottom-1 duration-200";

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
	return (
		<div className={cn(scroller, "flex flex-col px-3 pb-3")}>
			{!tasks.length && (
				<p className={cn(empty, "px-2 py-1")}>
					Tasks you trigger show up here.
				</p>
			)}
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

const SWEEP: Record<string, string> = {
	patch: "via-patch",
	asset: "via-asset",
	decal: "via-decal",
	render: "via-decal",
	source: "via-source",
	designer: "via-designer",
};
const TAG: Partial<Record<Task["status"], string>> = {
	failed: "bg-bad/10 text-bad",
	held: "bg-patch/10 text-patch",
	queued: "bg-muted text-muted-foreground",
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
	const hue = designer ? "designer" : t.kind;
	return (
		// biome-ignore lint/a11y: mouse shortcut to focus the object; the same focus is reachable from the timeline and by voice
		<div
			className={cn(
				rise,
				"border-border relative flex-none overflow-hidden border-t px-2 py-2.5 transition-[background-color,opacity] first:border-t-transparent",
				designer && "bg-designer/5",
				(t.status === "nochange" ||
					t.status === "cancelled" ||
					t.status === "superseded") &&
					"opacity-60",
				t.status === "queued" && "opacity-70",
				focusable && "hover:bg-muted/70 cursor-pointer",
			)}
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
			<div className="flex items-center gap-2">
				<Dot agent={hue} pulse={t.status === "running"} />
				<span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
					{title}
				</span>
				<span
					className={cn(
						"text-muted-foreground text-xs tabular-nums",
						t.status === "running" && "text-primary font-semibold",
					)}
				>
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
				<div className="text-designer mt-0.5 ml-3.5 text-xs font-semibold">
					designer · {t.model}
				</div>
			)}
			{t.kind === "patch" && t.designer && (t.brief || t.say) && (
				<div className="mt-1 ml-3.5 flex flex-col gap-0.5 text-xs leading-snug">
					{t.brief && (
						<p className="text-text-2 line-clamp-3" title={t.brief}>
							<b className="text-designer mr-1 text-[9.5px] font-medium tracking-[0.07em] uppercase">
								brief
							</b>
							{t.brief}
						</p>
					)}
					{t.say && (
						<p className="text-muted-foreground line-clamp-2 italic">{t.say}</p>
					)}
				</div>
			)}
			<div className="mt-1 flex min-h-6 items-center gap-2 pl-3.5">
				<span
					className={cn(
						"text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs",
						t.status === "failed" && "text-bad",
						planning && "text-designer",
					)}
					title={statusLine}
				>
					{STATUS_WORD[t.status] && (
						<Badge
							className={cn(
								"h-5 rounded-full px-2 text-[10px] font-semibold",
								TAG[t.status] ?? "bg-muted text-text-2",
							)}
						>
							{STATUS_WORD[t.status]}
						</Badge>
					)}
					{(t.status === "running" && t.kind !== "patch") || planning ? (
						<Spinner className="text-primary size-3" />
					) : null}
					<span className="truncate">{statusLine}</span>
				</span>
				<span className="flex flex-none items-center gap-1.5">
					{t.verify && <VerifyBadge v={t.verify} />}
					{cancellable && (
						<Button
							variant="outline"
							size="xs"
							className="h-6 px-2.5 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								manager.cancel(t.id);
							}}
						>
							Cancel
						</Button>
					)}
				</span>
			</div>
			{((live && t.kind !== "patch") || planning) && (
				<div className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full">
					<div
						className={cn(
							"animate-sweep h-full w-2/5 bg-linear-to-r from-transparent to-transparent",
							SWEEP[hue],
						)}
					/>
				</div>
			)}
		</div>
	);
}

function VerifyBadge({ v }: { v: NonNullable<Task["verify"]> }) {
	const cls = "h-5 rounded-full px-2 text-[10px] font-semibold";
	if (v.state === "pending")
		return (
			<Badge
				className={cn(cls, "animate-breathe text-muted-foreground bg-muted")}
			>
				verifying…
			</Badge>
		);
	if (v.state === "error")
		return (
			<Badge
				className={cn(cls, "text-faint bg-muted")}
				title="verify call failed"
			>
				verify n/a
			</Badge>
		);
	const word =
		v.state === "ok"
			? "verified"
			: v.state === "unsure"
				? "unsure"
				: "mismatch";
	const tone =
		v.state === "ok"
			? "bg-ok/10 text-ok"
			: v.state === "unsure"
				? "bg-warn/10 text-warn"
				: "bg-bad/10 text-bad";
	return (
		<Badge
			className={cn(cls, tone)}
			title="screenshot checked against the request"
		>
			{word} {v.score.toFixed(2)}
		</Badge>
	);
}

const OP_TONE: Record<string, string> = {
	patch: "text-patch",
	asset: "text-asset",
	decal: "text-decal",
	render: "text-decal",
	source: "text-source",
	undo: "text-warn",
};

export function OpsLog({ state }: { state: StudioState }) {
	const { ref, onScroll } = useStickToBottom(state.opsLog.length);
	return (
		<div
			className={cn(
				scroller,
				"px-3 py-2 font-mono text-[10.5px] leading-[1.75]",
			)}
			ref={ref}
			onScroll={onScroll}
		>
			{state.opsLog.length === 0 && (
				<p className="text-faint font-mono text-[11px]">no ops applied yet</p>
			)}
			{state.opsLog.map((o) => (
				<div key={o.id} className="flex gap-2 whitespace-nowrap">
					<span className="text-faint flex-none">{clock(o.at)}</span>
					<span
						className={cn(
							"text-text-2 min-w-0 flex-1 truncate",
							OP_TONE[o.kind],
						)}
					>
						{o.text}
					</span>
					{o.ms != null && (
						<span className="text-muted-foreground flex-none">
							{fmtMs(o.ms)}
						</span>
					)}
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
	const status = "min-w-0 flex-auto truncate text-xs text-muted-foreground";
	return (
		<div>
			<div className="mb-2 flex min-w-0 items-center gap-2 px-1">
				<span className="text-foreground max-w-[55%] flex-none truncate text-sm font-semibold">
					{g.name}
				</span>
				{g.status === "running" && (
					<span className={cn(status, "flex items-center gap-1.5")}>
						<Spinner className="size-3" />
						{g.statusLine}
					</span>
				)}
				{g.status === "failed" && (
					<span className={cn(status, "text-bad")}>
						no products · {g.statusLine}
					</span>
				)}
				{g.status === "cancelled" && <span className={status}>cancelled</span>}
				{g.status === "done" && g.model && (
					<span className={status}>{g.model}</span>
				)}
				{g.status === "running" && (
					<Button
						variant="outline"
						size="xs"
						className="h-6 px-2.5 text-xs"
						onClick={() => manager.cancel(g.taskId)}
					>
						Cancel
					</Button>
				)}
			</div>
			{g.products.length > 0 && (
				<div className="grid grid-cols-2 gap-2">
					{g.products.map((p, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: products have no id and the list never reorders
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
	const price = String(p.price ?? "").slice(0, 40);
	const cls =
		"flex min-w-0 flex-col gap-2 rounded-[20px] bg-card p-1.5 pb-2.5 shadow-[var(--shadow-soft)] transition-shadow";
	const body = (
		<>
			<span className="bg-muted relative block aspect-square overflow-hidden rounded-2xl">
				{src ? (
					// biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is the image fallback chain, not an interaction
					<img
						src={src}
						alt=""
						loading="lazy"
						referrerPolicy="no-referrer"
						className="block size-full object-cover"
						onError={() => setStage((s) => (s === 0 ? 1 : 2))}
					/>
				) : (
					<span
						className="text-faint grid size-full place-items-center"
						aria-hidden
					>
						<House className="size-6" />
					</span>
				)}
				{price && (
					<span className="absolute top-2 left-2 inline-flex h-5.5 max-w-[calc(100%-16px)] items-center truncate rounded-full bg-black/60 px-2 text-xs font-semibold text-white">
						{price}
					</span>
				)}
			</span>
			<span
				className="text-foreground line-clamp-2 px-1 text-sm leading-[18px] font-semibold"
				title={title}
			>
				{title || "Product"}
			</span>
			<span className="text-muted-foreground -mt-1 truncate px-1 text-xs">
				{String(p.store ?? "").slice(0, 60)}
			</span>
		</>
	);
	return href ? (
		<a
			className={cn(cls, "hover:shadow-[var(--shadow-float)]")}
			href={href}
			target="_blank"
			rel="noopener noreferrer"
		>
			{body}
		</a>
	) : (
		<div className={cls}>{body}</div>
	);
}
