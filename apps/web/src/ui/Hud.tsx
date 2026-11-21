import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@gemini-hack/ui/components/alert-dialog";
import { Badge } from "@gemini-hack/ui/components/badge";
import { Button } from "@gemini-hack/ui/components/button";
import { Label } from "@gemini-hack/ui/components/label";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { Switch } from "@gemini-hack/ui/components/switch";
import { cn } from "@gemini-hack/ui/lib/utils";
import { Camera, House, Undo2 } from "lucide-react";
import type { ChipState } from "../App";
import { glass, Hint } from "./parts";
import { fmtMs } from "./Timeline";

type Props = {
	chip: ChipState;
	chipDetail: string;
	mock: boolean;
	verifyEnabled: boolean;
	onVerify(on: boolean): void;
	onUndo(): void;
	shopEnabled: boolean;
	onShop(on: boolean): void;
	onNewRoom(): void;
	onRender(): void;
	rendering: boolean;
	stats: { last: number | null; median: number | null; jobs: number };
};

const CHIP_LABEL: Record<ChipState, string> = {
	idle: "idle",
	connecting: "connecting",
	listening: "listening",
	fallback: "fallback · type below",
};
const CHIP_DOT: Record<ChipState, string> = {
	idle: "bg-faint",
	connecting: "bg-warn animate-breathe",
	listening: "bg-ok animate-pulse-dot text-ok",
	fallback: "bg-bad",
};

const pill = cn(glass, "text-text-2 h-8 rounded-full px-2.5 text-xs");

export function Hud({
	chip,
	chipDetail,
	mock,
	verifyEnabled,
	onVerify,
	onUndo,
	onNewRoom,
	onRender,
	rendering,
	stats,
}: Props) {
	return (
		<>
			<div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 *:pointer-events-auto">
				<div className={cn(pill, "flex items-center gap-2")}>
					<House className="text-foreground size-4" aria-hidden />
					<span className="text-foreground font-semibold">Studio</span>
					<span className="text-muted-foreground">voice-driven interiors</span>
				</div>
				<Badge
					variant="outline"
					className={cn(pill, "max-w-80 gap-1.5")}
					title={chipDetail || undefined}
				>
					<i className={cn("size-1.5 rounded-full", CHIP_DOT[chip])} />
					{CHIP_LABEL[chip]}
					{chipDetail && chip !== "idle" && (
						<span className="text-muted-foreground truncate">{chipDetail}</span>
					)}
				</Badge>
				{mock && (
					<Badge variant="outline" className={cn(pill, "text-warn")}>
						mock
					</Badge>
				)}
			</div>

			<div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2 *:pointer-events-auto">
				<Hint label="Orchestrator round-trip latency">
					<div className={cn(glass, "flex h-8 items-stretch rounded-full")}>
						<Readout label="last" value={stats.last} />
						<Readout label="median" value={stats.median} />
						<Readout label="jobs" value={stats.jobs} live={stats.jobs > 0} />
					</div>
				</Hint>
				<Hint label="After each change, screenshot the room and check it against what you asked">
					<Label
						htmlFor="verify-switch"
						className={cn(pill, "cursor-pointer gap-2 text-xs")}
					>
						<Switch
							id="verify-switch"
							checked={verifyEnabled}
							onCheckedChange={(on) => onVerify(on)}
							className="data-checked:bg-ok"
						/>
						Verify
					</Label>
				</Hint>
				<Hint label="Photoreal render of the current view (or say “render it”)">
					<Button
						variant="outline"
						className={cn(pill, "border-decal/40 text-foreground")}
						onClick={onRender}
					>
						{rendering ? <Spinner /> : <Camera />}
						Photoreal
					</Button>
				</Hint>
				<Hint label="Undo (Ctrl+Z)">
					<Button variant="outline" className={pill} onClick={onUndo}>
						<Undo2 />
						Undo
					</Button>
				</Hint>
				<NewRoom onConfirm={onNewRoom} />
			</div>
		</>
	);
}

function Readout({
	label,
	value,
	live,
}: {
	label: string;
	value: number | null;
	live?: boolean;
}) {
	const text =
		value == null ? "—" : label === "jobs" ? String(value) : fmtMs(value);
	return (
		<div className="not-first:border-border flex min-w-11 flex-col justify-center px-2.5 leading-none not-first:border-l">
			<span className="text-muted-foreground text-[9px] tracking-wider uppercase">
				{label}
			</span>
			<span
				className={cn(
					"text-foreground mt-0.5 font-mono text-[11px]",
					live && "text-cursor",
				)}
			>
				{text}
			</span>
		</div>
	);
}

function NewRoom({ onConfirm }: { onConfirm(): void }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={
					<Button variant="outline" className={pill}>
						New room
					</Button>
				}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Start a new room?</AlertDialogTitle>
					<AlertDialogDescription>
						This clears the scene, tasks and transcript.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>New room</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
