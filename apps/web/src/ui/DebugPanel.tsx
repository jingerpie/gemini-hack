// Debug drawer under the transcript: latency and counters at a glance, and on open the agent
// timeline, the scene-op log, the pipeline switches and a typed-command box.
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@gemini-hack/ui/components/collapsible";
import { Label } from "@gemini-hack/ui/components/label";
import { Switch } from "@gemini-hack/ui/components/switch";
import { cn } from "@gemini-hack/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { healthQuery } from "../lib/queries";
import type { StudioState, TaskManager } from "../lib/taskManager";
import type { HealthResponse } from "../types";
import { type Agent, Dot, Hint, surface } from "./parts";
import { Counter, OpsLog } from "./Sidebar";
import { fmtMs, Timeline } from "./Timeline";
import { TypeInstead } from "./Voice";

type LegendItem = { agent: Agent; label: string; title: string };

// Shown until /api/health answers (or when the server is unreachable).
const FALLBACK_LEGEND: LegendItem[] = [
	{
		agent: "patch",
		label: "orchestrator · hydrogen",
		title: "orchestrator · gemini-4-hydrogen",
	},
	{
		agent: "designer",
		label: "designer · argon",
		title: "designer · gemini-4-argon (whole-room requests)",
	},
	{
		agent: "asset",
		label: "3D agent",
		title: "3D models · managed agent (antigravity)",
	},
	{
		agent: "decal",
		label: "image · nano-banana",
		title: "images and photoreal renders · nano-banana",
	},
	{
		agent: "source",
		label: "shopping agent",
		title: "sourcing agent · antigravity + Google Search",
	},
];

/** "gemini-4-hydrogen" -> "hydrogen", "gemini-nano-banana-2.1" -> "nano-banana-2.1" */
const short = (model: string) => model.replace(/^gemini-(\d+(\.\d+)?-)?/, "");

function legendFrom(h: HealthResponse | undefined): LegendItem[] {
	if (!h) return FALLBACK_LEGEND;
	const m = h.models;
	return [
		{
			agent: "patch",
			label: `orchestrator · ${short(m.patch)}`,
			title: `orchestrator · ${m.patch}`,
		},
		{
			agent: "designer",
			label: `designer · ${short(m.designer)}`,
			title: `designer · ${m.designer} (whole-room requests)`,
		},
		{
			agent: "asset",
			label: "3D agent",
			title: `3D models · managed agent ${m.asset.AGENT}, direct ${m.asset.DIRECT_MODEL}`,
		},
		{
			agent: "decal",
			label: `image · ${short(m.image)}`,
			title: `images and photoreal renders · ${m.image}`,
		},
		{
			agent: "source",
			label: "shopping agent",
			title: `sourcing agent · ${m.source.agent} + Google Search, direct ${m.source.direct}`,
		},
	];
}

export function DebugPanel({
	state,
	manager,
	stats,
	onSend,
}: {
	state: StudioState;
	manager: TaskManager;
	stats: { last: number | null; median: number | null; jobs: number };
	onSend(text: string): void;
}) {
	const [open, setOpen] = useState(false);
	const legend = legendFrom(useQuery(healthQuery).data);
	const ms = (v: number | null) => (v == null ? "—" : fmtMs(v));
	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			render={<section aria-label="Debug" className={surface} />}
		>
			<CollapsibleTrigger className="flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 text-left text-xs">
				<b className="text-sm font-semibold">Debug</b>
				<Hint label="Orchestrator round-trip latency">
					<span>
						<span className="text-muted-foreground">last</span>{" "}
						<b className="font-semibold">{ms(stats.last)}</b>{" "}
						<span className="text-muted-foreground">median</span>{" "}
						<b className="font-semibold">{ms(stats.median)}</b>
					</span>
				</Hint>
				<span className={cn(stats.jobs > 0 && "text-primary")}>
					<b className="font-semibold">{stats.jobs}</b>{" "}
					<span className="text-muted-foreground">jobs</span>
				</span>
				<span className="text-muted-foreground flex gap-3">
					<Counter n={state.counters.objects} label="objects" />
					<Counter n={state.counters.decals} label="decals" />
					<Counter n={state.counters.done} label="done" />
					<Counter n={state.counters.failed} label="failed" bad />
				</span>
				<span className="text-muted-foreground ml-auto flex items-center gap-1.5">
					{open ? "Hide" : "Show"}
					<ChevronDown
						className={cn("size-4 transition-transform", open && "rotate-180")}
					/>
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent className="border-border flex flex-col gap-4 border-t px-5 pt-4 pb-5">
				<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
					<Hint label="After each change, screenshot the room and check it against what you asked">
						<Label
							htmlFor="verify-switch"
							className="cursor-pointer gap-2 text-sm"
						>
							<Switch
								id="verify-switch"
								checked={state.verifyEnabled}
								onCheckedChange={(on) => manager.setVerifyEnabled(on)}
							/>
							Verify each change
						</Label>
					</Hint>
					<Hint label="For each new custom object, a sourcing agent finds 3 real products you can buy">
						<Label
							htmlFor="shop-switch"
							className="cursor-pointer gap-2 text-sm"
						>
							<Switch
								id="shop-switch"
								checked={state.shopEnabled}
								onCheckedChange={(on) => manager.setShopEnabled(on)}
							/>
							Shop the look
						</Label>
					</Hint>
					<TypeInstead onSend={onSend} className="ml-auto" />
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
						<h3 className="text-sm font-semibold">Agent timeline</h3>
						<div className="text-muted-foreground flex flex-wrap gap-x-3.5 gap-y-0.5 text-xs">
							{legend.map((l) => (
								<span
									key={l.agent}
									title={l.title}
									className="flex items-center gap-1.5 whitespace-nowrap"
								>
									<Dot agent={l.agent} className="size-2" /> {l.label}
								</span>
							))}
						</div>
					</div>
					<Timeline manager={manager} />
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="text-sm font-semibold">Scene ops</h3>
					<div className="bg-muted/50 flex h-40 flex-col rounded-2xl">
						<OpsLog state={state} />
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
