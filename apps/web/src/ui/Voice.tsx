// Voice UI: the floating talk button over the 3D view and the live caption card under it.
import { Button } from "@gemini-hack/ui/components/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@gemini-hack/ui/components/input-group";
import { Kbd } from "@gemini-hack/ui/components/kbd";
import { cn } from "@gemini-hack/ui/lib/utils";
import { CornerDownLeft, Mic, MicOff } from "lucide-react";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import type { ChipState } from "../App";
import type { StudioState } from "../lib/taskManager";
import { surface } from "./parts";

export function TalkButton({
	chip,
	listening,
	levelRef,
	onToggle,
}: {
	chip: ChipState;
	listening: boolean;
	levelRef: MutableRefObject<number>;
	onToggle(): void;
}) {
	return (
		<Button
			onClick={onToggle}
			className={cn(
				"h-13 gap-3 rounded-full px-6 text-base tracking-[-0.5px] shadow-[var(--shadow-float)]",
				listening
					? "bg-ok hover:bg-ok/90 text-white"
					: "bg-primary text-primary-foreground hover:bg-primary/90 pr-3",
				chip === "connecting" && "animate-breathe",
			)}
		>
			{listening ? (
				<>
					<Meter levelRef={levelRef} tone="bg-white" />
					{chip === "connecting" ? "Connecting…" : "Listening, tap to stop"}
				</>
			) : (
				<>
					<Mic className="size-4.5" />
					Start talking
					<Kbd className="h-7 rounded-full bg-white/20 px-2.5 text-xs font-semibold text-white">
						Space
					</Kbd>
				</>
			)}
		</Button>
	);
}

/** Caption card under the 3D view: what you are saying right now, or the last thing you said. */
export function LiveCaption({
	state,
	chip,
	listening,
	levelRef,
	onSend,
}: {
	state: StudioState;
	chip: ChipState;
	listening: boolean;
	levelRef: MutableRefObject<number>;
	onSend(text: string): void;
}) {
	const lastUser = [...state.transcript]
		.reverse()
		.find((l) => l.kind === "user");
	const lastSay = [...state.transcript].reverse().find((l) => l.kind === "say");
	const reply =
		lastSay && lastUser && lastSay.at >= lastUser.at ? lastSay.text : null;
	const live = listening && state.interim;
	return (
		<section
			aria-label="Transcript"
			className={cn(
				surface,
				"flex min-h-43 flex-col justify-between gap-4 px-6 py-5",
			)}
		>
			<div className="flex flex-col gap-2">
				{live ? (
					<p
						aria-live="polite"
						className="text-[28px] leading-8 font-bold tracking-[-1px]"
					>
						{state.interim}
						<span className="animate-blink bg-primary ml-1 inline-block h-7 w-0.5 align-[-5px]" />
					</p>
				) : listening ? (
					<p className="text-muted-foreground text-[28px] leading-8 font-bold tracking-[-1px]">
						Say what to change…
					</p>
				) : lastUser ? (
					<p className="text-[28px] leading-8 font-bold tracking-[-1px]">
						{lastUser.text}
					</p>
				) : (
					<p className="text-muted-foreground text-[28px] leading-8 font-bold tracking-[-1px]">
						Describe the room you want.
					</p>
				)}
				{reply && !live && (
					<p className="text-muted-foreground max-w-180 text-sm">{reply}</p>
				)}
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<VoiceStatus chip={chip} listening={listening} levelRef={levelRef} />
				{chip === "fallback" && <TypeInstead onSend={onSend} />}
			</div>
		</section>
	);
}

function VoiceStatus({
	chip,
	listening,
	levelRef,
}: {
	chip: ChipState;
	listening: boolean;
	levelRef: MutableRefObject<number>;
}) {
	if (chip === "fallback")
		return (
			<span className="text-bad flex items-center gap-2.5 text-xs font-semibold">
				<MicOff className="size-4" />
				Mic unavailable, type your change instead
			</span>
		);
	if (listening)
		return (
			<span className="text-ok flex items-center gap-2.5 text-xs font-semibold">
				<Meter levelRef={levelRef} tone="bg-ok" bars={4} />
				{chip === "connecting" ? "Connecting" : "Listening"}
			</span>
		);
	return (
		<span className="text-muted-foreground flex items-center gap-2.5 text-xs">
			<Mic className="size-4" />
			<b className="font-semibold">Paused</b>
			Press Space or Start talking
		</span>
	);
}

export function TypeInstead({
	onSend,
	className,
}: {
	onSend(text: string): void;
	className?: string;
}) {
	const [text, setText] = useState("");
	return (
		<form
			className={cn("w-full max-w-90", className)}
			onSubmit={(e) => {
				e.preventDefault();
				const t = text.trim();
				if (!t) return;
				onSend(t);
				setText("");
			}}
		>
			<InputGroup className="bg-card h-10">
				<InputGroupInput
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Type a change and press Enter"
					spellCheck={false}
					aria-label="Type a command"
				/>
				<InputGroupAddon align="inline-end">
					<Kbd>
						<CornerDownLeft />
					</Kbd>
				</InputGroupAddon>
			</InputGroup>
		</form>
	);
}

/** Level meter driven by the mic RMS in `levelRef`, animated outside React. */
export function Meter({
	levelRef,
	tone,
	bars = 7,
}: {
	levelRef: MutableRefObject<number>;
	tone: string;
	bars?: number;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		const hist = new Array(bars).fill(0);
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
			for (let i = 0; i < bars; i++) {
				const center = 1 - Math.abs(i - (bars - 1) / 2) / bars;
				const v = hist[i] * (0.55 + 0.45 * center);
				(kids[i] as HTMLElement).style.transform =
					`scaleY(${(0.2 + v * 0.8).toFixed(3)})`;
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [levelRef, bars]);
	return (
		<span className="flex h-4.5 items-center gap-[3px]" ref={ref} aria-hidden>
			{Array.from({ length: bars }, (_, i) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length bar list
					key={i}
					className={cn("h-full w-[3px] origin-center rounded-full", tone)}
				/>
			))}
		</span>
	);
}
