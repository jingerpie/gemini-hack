import { Badge } from "@gemini-hack/ui/components/badge";
import { Button } from "@gemini-hack/ui/components/button";
import {
	Card,
	CardAction,
	CardHeader,
	CardTitle,
} from "@gemini-hack/ui/components/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@gemini-hack/ui/components/collapsible";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	DESIGNER_HINT_MS,
	type StudioState,
	type Task,
	type TaskManager,
} from "../lib/taskManager";
import { CartPanel } from "./CartPanel";
import { Dot } from "./parts";
import { fmtMs } from "./Timeline";

export const panel = "min-h-0 gap-0 rounded-xl py-0 ring-border";
export const scroller =
	"min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgb(255_255_255/0.08)_transparent] [scrollbar-width:thin]";
export const empty = "text-[12.5px] text-faint";

export function PanelHead({
	title,
	meta,
	className,
}: {
	title: ReactNode;
	meta?: ReactNode;
	className?: string;
}) {
	return (
		<CardHeader
			className={cn(
				"border-border flex h-9 flex-none items-center justify-between border-b px-3.5 py-0 [.border-b]:pb-0",
				className,
			)}
		>
			<CardTitle className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-[0.09em] uppercase">
				{title}
			</CardTitle>
			{meta ? (
				<CardAction className="text-faint flex items-center gap-1.5 self-center font-mono text-[10.5px]">
					{meta}
				</CardAction>
			) : null}
		</CardHeader>
	);
}

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
		<aside className="flex min-h-0 flex-col gap-2.5 p-3">
			<Card className={cn(panel, "min-h-24 flex-[0.9_1_0]")}>
				<PanelHead
					title="Transcript"
					meta={state.transcript.filter((l) => l.kind === "user").length || ""}
				/>
				<Transcript state={state} />
			</Card>

			<Card className={cn(panel, "min-h-42 flex-[1.5_1_0]")}>
				<PanelHead
					title="Tasks"
					meta={
						state.counters.running ? (
							<>
								<Dot agent="asset" pulse />
								{state.counters.running} running
							</>
						) : (
							state.tasks.length || ""
						)
					}
				/>
				<TaskList tasks={state.tasks} manager={manager} />
			</Card>

			<CartPanel manager={manager} />

			<Collapsible
				open={opsOpen}
				onOpenChange={setOpsOpen}
				render={
					<Card
						className={cn(
							panel,
							"min-h-18",
							opsOpen
								? "flex-[0.8_1_0] [@media(max-height:860px)]:flex-[0.5_1_0]"
								: "flex-none",
						)}
					/>
				}
			>
				<PanelHead
					title={
						<CollapsibleTrigger className="hover:text-text-2 flex cursor-pointer items-center gap-1.5 uppercase select-none">
							<ChevronRight
								className={cn(
									"size-3.5 transition-transform",
									opsOpen && "rotate-90",
								)}
							/>
							Scene ops
						</CollapsibleTrigger>
					}
					meta={state.opsLog.length || ""}
				/>
				<CollapsibleContent className="flex min-h-0 flex-1 flex-col">
					<OpsLog state={state} />
				</CollapsibleContent>
				<div className="border-border text-muted-foreground flex flex-none gap-3.5 border-t px-3.5 py-2 text-[11px]">
					<Counter n={state.counters.objects} label="objects" />
					<Counter n={state.counters.decals} label="decals" />
					<Counter n={state.counters.done} label="done" />
					<Counter n={state.counters.failed} label="failed" bad />
				</div>
			</Collapsible>
		</aside>
	);
}

function Counter({
	n,
	label,
	bad,
}: {
	n: number;
	label: string;
	bad?: boolean;
}) {
	return (
		<span>
			<b
				className={cn(
					"text-text-2 mr-1 font-mono font-medium",
					bad && n > 0 && "text-bad",
				)}
			>
				{n}
			</b>
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

function Transcript({ state }: { state: StudioState }) {
	const { ref, onScroll } = useStickToBottom(
		`${state.transcript.length}|${state.interim}`,
	);
	const statusOf = (taskId?: string) =>
		state.tasks.find((t) => t.id === taskId);
	const isEmpty = state.transcript.length === 0 && !state.interim;
	return (
		<div
			className={cn(scroller, "flex flex-col gap-0.5 px-3.5 pt-3 pb-4")}
			ref={ref}
			onScroll={onScroll}
		>
			{isEmpty && <p className={empty}>No speech yet.</p>}
			{state.transcript.map((l) =>
				l.kind === "user" ? (
					<p
						key={l.id}
						className={cn(
							rise,
							"text-foreground pt-1.5 text-[14.5px] leading-normal transition-colors",
							lineClass(statusOf(l.taskId)),
						)}
					>
						{l.text}
					</p>
				) : (
					<p
						key={l.id}
						className={cn(
							rise,
							"border-patch/35 text-muted-foreground my-0.5 ml-px border-l-2 pl-3 text-[12.5px]",
						)}
					>
						{l.text}
					</p>
				),
			)}
			{state.interim && (
				<p className="pt-1.5 text-[14.5px] text-[#9aa6ba]">
					{state.interim}
					<span className="animate-blink bg-cursor ml-0.5 inline-block h-[1.05em] w-[7px] rounded-[1px] align-[-0.15em]" />
				</p>
			)}
		</div>
	);
}

function lineClass(t?: Task) {
	if (!t) return "";
	if (t.status === "running" || t.status === "held") return "text-[#cfd6e4]";
	if (t.status === "failed")
		return "text-muted-foreground line-through decoration-bad/60";
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
	return (
		<div className={cn(scroller, "flex flex-col gap-1.5 p-2")}>
			{!tasks.length && (
				<p className={cn(empty, "px-1.5 py-1")}>
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

const EDGE: Record<string, string> = {
	patch: "shadow-[inset_2px_0_0_var(--color-patch)]",
	designer: "shadow-[inset_2px_0_0_var(--color-designer)]",
	asset: "shadow-[inset_2px_0_0_var(--color-asset)]",
	decal: "shadow-[inset_2px_0_0_var(--color-decal)]",
	render: "shadow-[inset_2px_0_0_var(--color-decal)]",
	source: "shadow-[inset_2px_0_0_var(--color-source)]",
	failed: "shadow-[inset_2px_0_0_var(--color-bad)]",
};
const SWEEP: Record<string, string> = {
	patch: "via-white/35",
	asset: "via-asset",
	decal: "via-decal",
	render: "via-decal",
	source: "via-source",
	designer: "via-designer",
};
const TAG: Partial<Record<Task["status"], string>> = {
	failed: "bg-bad/15 text-[#e89590]",
	held: "bg-patch/15 text-[#a8c0e2]",
	queued: "bg-white/5 text-muted-foreground",
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
	const edge = designer
		? EDGE.designer
		: t.status === "failed"
			? EDGE.failed
			: live
				? EDGE[t.kind]
				: "";
	return (
		// biome-ignore lint/a11y: mouse shortcut to focus the object; the same focus is reachable from the timeline and by voice
		<div
			className={cn(
				rise,
				"border-border bg-muted relative flex-none overflow-hidden rounded-[10px] border py-2 pr-2.5 pl-3 transition-[border-color,opacity]",
				edge,
				live && "border-white/10",
				designer && "from-designer/7 bg-linear-to-b to-transparent",
				planning && "border-designer/45",
				(t.status === "nochange" ||
					t.status === "cancelled" ||
					t.status === "superseded") &&
					"opacity-60",
				t.status === "queued" && "border-dashed opacity-70",
				focusable && "hover:border-input cursor-pointer hover:bg-[#1a1c22]",
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
				<span className="text-foreground min-w-0 flex-1 truncate text-[12.5px]">
					{title}
				</span>
				<span
					className={cn(
						"text-muted-foreground font-mono text-[10.5px] tabular-nums",
						t.status === "running" && "text-text-2",
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
				<div className="mt-0.5 ml-3.5 font-mono text-[10px] tracking-wide text-[#dcaed0]">
					designer · {t.model}
				</div>
			)}
			{t.kind === "patch" && t.designer && (t.brief || t.say) && (
				<div className="mt-1 ml-3.5 flex flex-col gap-0.5 text-[11.5px] leading-snug">
					{t.brief && (
						<p className="text-text-2 line-clamp-3" title={t.brief}>
							<b className="mr-1 text-[9.5px] font-medium tracking-[0.07em] text-[#dcaed0] uppercase">
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
			<div className="mt-1 flex min-h-5 items-center gap-2 pl-3.5">
				<span
					className={cn(
						"text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 truncate text-[11.5px]",
						t.status === "failed" && "text-[#e08c86]",
						planning && "text-[#e2b4d6]",
					)}
					title={statusLine}
				>
					{STATUS_WORD[t.status] && (
						<Badge
							className={cn(
								"h-4 rounded px-1.5 text-[9.5px] tracking-[0.07em] uppercase",
								TAG[t.status] ?? "text-text-2 bg-white/6",
							)}
						>
							{STATUS_WORD[t.status]}
						</Badge>
					)}
					{(t.status === "running" && t.kind !== "patch") || planning ? (
						<Spinner className="text-text-2 size-3" />
					) : null}
					<span className="truncate">{statusLine}</span>
				</span>
				<span className="flex flex-none items-center gap-1.5">
					{t.verify && <VerifyBadge v={t.verify} />}
					{cancellable && (
						<Button
							variant="outline"
							size="xs"
							className="text-muted-foreground hover:text-foreground h-5 rounded-md bg-transparent text-[11px]"
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
				<div className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
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
	const cls = "h-4 rounded-[5px] px-1.5 font-mono text-[10px]";
	if (v.state === "pending")
		return (
			<Badge
				className={cn(cls, "animate-breathe text-muted-foreground bg-white/5")}
			>
				verifying…
			</Badge>
		);
	if (v.state === "error")
		return (
			<Badge
				className={cn(cls, "text-faint bg-white/4")}
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
			? "bg-ok/13 text-[#7fd1a6]"
			: v.state === "unsure"
				? "bg-warn/13 text-[#e2b468]"
				: "bg-bad/14 text-[#ec8d86]";
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
	patch: "text-[#b5c7e2]",
	asset: "text-[#bdb2e6]",
	decal: "text-[#9fd2ca]",
	render: "text-[#9fd2ca]",
	source: "text-[#e2c597]",
	undo: "text-warn",
};

function OpsLog({ state }: { state: StudioState }) {
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
