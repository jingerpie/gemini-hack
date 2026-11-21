import { Button } from "@gemini-hack/ui/components/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@gemini-hack/ui/components/input-group";
import { Kbd } from "@gemini-hack/ui/components/kbd";
import { cn } from "@gemini-hack/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, Mic } from "lucide-react";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import type { ChipState } from "../App";
import { healthQuery } from "../lib/queries";
import type { HealthResponse } from "../types";
import { type Agent, Dot } from "./parts";

type Props = {
	chip: ChipState;
	listening: boolean;
	levelRef: MutableRefObject<number>;
	onToggle(): void;
	onSend(text: string): void;
};

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

export function Dock({ chip, listening, levelRef, onToggle, onSend }: Props) {
	const [text, setText] = useState("");
	const legend = legendFrom(useQuery(healthQuery).data);
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const t = text.trim();
					if (!t) return;
					onSend(t);
					setText("");
				}}
			>
				<InputGroup className="bg-card h-9 max-w-90 rounded-lg">
					<InputGroupInput
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={
							chip === "fallback"
								? "Mic unavailable — type a change…"
								: "Or type a change and press Enter"
						}
						spellCheck={false}
						aria-label="Type a command"
						className="text-[13px]"
					/>
					<InputGroupAddon align="inline-end">
						<Kbd>
							<CornerDownLeft />
						</Kbd>
					</InputGroupAddon>
				</InputGroup>
			</form>

			<Button
				onClick={onToggle}
				className={cn(
					"h-10 min-w-48 gap-2.5 rounded-full px-5 text-[13px] font-medium shadow-lg",
					listening
						? "bg-ok/15 text-foreground ring-ok/50 hover:bg-ok/20 ring-1"
						: "bg-foreground text-background hover:bg-foreground/90",
					chip === "connecting" && "animate-breathe",
				)}
			>
				{listening ? (
					<>
						<Meter levelRef={levelRef} />
						<span>{chip === "connecting" ? "Connecting…" : "Listening…"}</span>
						<span className="text-muted-foreground flex items-center gap-1.5">
							<i className="bg-bad size-2 rounded-[2px]" /> Stop
						</span>
					</>
				) : (
					<>
						<Mic />
						<span>Start talking</span>
						<Kbd className="bg-background/10 text-background/70">Space</Kbd>
					</>
				)}
			</Button>

			<div className="text-muted-foreground flex flex-wrap justify-end gap-x-3 gap-y-0.5 text-[11px]">
				{legend.map((l) => (
					<span
						key={l.agent}
						title={l.title}
						className="flex items-center gap-1.5 whitespace-nowrap"
					>
						<Dot agent={l.agent} /> {l.label}
					</span>
				))}
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
			const target = Math.min(
				1,
				Math.sqrt(Math.max(0, levelRef.current)) * 1.4,
			);
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
				(kids[i] as HTMLElement).style.transform =
					`scaleY(${(0.14 + v * 0.86).toFixed(3)})`;
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [levelRef]);
	return (
		<span className="flex h-4 items-center gap-0.5" ref={ref} aria-hidden>
			{Array.from({ length: BARS }, (_, i) => (
				<i key={i} className="bg-ok h-full w-0.5 origin-center rounded-full" />
			))}
		</span>
	);
}
