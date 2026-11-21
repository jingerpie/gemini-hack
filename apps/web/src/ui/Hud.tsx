// Studio header: page title, voice/mock status, and the room-level actions (New room, Check out, Render).
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
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Camera, ShoppingBag } from "lucide-react";
import type { ChipState } from "../App";
import { demoItemCount, demoTotal, fmtUsd } from "../catalog/demoCart";
import { Hint } from "./parts";

type Props = {
	chip: ChipState;
	chipDetail: string;
	mock: boolean;
	onNewRoom(): void;
	onRender(): void;
	rendering: boolean;
};

const CHIP_LABEL: Partial<Record<ChipState, string>> = {
	connecting: "Connecting mic",
	fallback: "Mic unavailable",
};
const CHIP_TONE: Partial<Record<ChipState, string>> = {
	connecting: "bg-warn/10 text-warn",
	fallback: "bg-bad/10 text-bad",
};

const action = "h-11 px-4.5 text-sm";

export function Header({
	chip,
	chipDetail,
	mock,
	onNewRoom,
	onRender,
	rendering,
}: Props) {
	return (
		<header className="flex min-h-14 flex-wrap items-center gap-3">
			<div className="min-w-0 flex-[1_1_160px]">
				<h1 className="text-xl leading-[22px] font-semibold tracking-[-1px]">
					Studio
				</h1>
				<p className="text-muted-foreground mt-0.5 text-xs">
					Voice-driven interiors
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2">
				{CHIP_LABEL[chip] && (
					<Badge
						className={cn(
							"h-8 max-w-80 rounded-full px-3 text-xs font-semibold",
							CHIP_TONE[chip],
						)}
						title={chipDetail || undefined}
					>
						{CHIP_LABEL[chip]}
					</Badge>
				)}
				{mock && (
					<Badge className="bg-warn/10 text-warn h-8 rounded-full px-3 text-xs font-semibold">
						Mock mode
					</Badge>
				)}
				<NewRoom onConfirm={onNewRoom} />
				<Hint label="Buy everything in this room, one checkout per store">
					<Button
						nativeButton={false}
						render={<Link to="/checkout" />}
						className={cn(
							action,
							"bg-foreground text-background hover:bg-foreground/85 pr-2",
						)}
					>
						<ShoppingBag />
						Check out
						<span className="bg-background/15 inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold">
							{demoItemCount} items · {fmtUsd(demoTotal)}
						</span>
					</Button>
				</Hint>
				<Hint label="Photoreal render of the current view (or say “render it”)">
					<Button className={action} onClick={onRender}>
						{rendering ? <Spinner /> : <Camera />}
						Render
					</Button>
				</Hint>
			</div>
		</header>
	);
}

function NewRoom({ onConfirm }: { onConfirm(): void }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={
					<Button
						variant="outline"
						className={cn(
							action,
							"bg-card border-transparent shadow-[var(--shadow-soft)]",
						)}
					>
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
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/90 text-white"
						onClick={onConfirm}
					>
						New room
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
