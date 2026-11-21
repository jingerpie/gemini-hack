// Photoreal render shown over the 3D view, with a draggable before/after split.
// The 3D room underneath stays the source of truth; closing the overlay leaves it untouched and editable.
import { Button } from "@gemini-hack/ui/components/button";
import { cn } from "@gemini-hack/ui/lib/utils";
import { ChevronsLeftRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RenderView } from "../lib/taskManager";
import { Dot, glass } from "./parts";
import { fmtMs } from "./Timeline";

const IMG = "pointer-events-none absolute inset-0 block size-full object-cover";
const TAG =
	"pointer-events-none absolute top-15 rounded-full bg-[#0a0b0e]/55 px-2.5 py-0.5 text-[11px] tracking-wide text-white backdrop-blur-sm transition-opacity";

export function RenderOverlay({
	view,
	onClose,
}: {
	view: RenderView;
	onClose(): void;
}) {
	const [split, setSplit] = useState(50); // % from the left: left of it = 3D view, right = render
	const boxRef = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => setSplit(50), [view.taskId]);

	const setFrom = (clientX: number) => {
		const r = boxRef.current?.getBoundingClientRect();
		if (!r || r.width <= 0) return;
		setSplit(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
	};

	return (
		<div
			className="animate-in fade-in absolute inset-0 z-5 bg-[#0b0c0f] duration-300"
			role="dialog"
			aria-label="Photoreal render"
		>
			<div
				className="absolute inset-0 cursor-ew-resize touch-none overflow-hidden select-none"
				ref={boxRef}
				onPointerDown={(e) => {
					dragging.current = true;
					(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
					setFrom(e.clientX);
				}}
				onPointerMove={(e) => {
					if (dragging.current) setFrom(e.clientX);
				}}
				onPointerUp={() => (dragging.current = false)}
				onPointerCancel={() => (dragging.current = false)}
			>
				<img
					className={IMG}
					src={view.after}
					alt="Photoreal render of the room"
					draggable={false}
				/>
				<img
					className={IMG}
					src={view.before}
					alt="3D view"
					draggable={false}
					style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
				/>
				<div
					className="pointer-events-none absolute inset-y-0 -ml-px w-0.5 bg-white/85 shadow-[0_0_0_1px_rgb(0_0_0/0.25),0_0_14px_rgb(0_0_0/0.4)]"
					style={{ left: `${split}%` }}
				>
					<span
						className="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full bg-white/90 text-[#15171c] shadow-lg"
						aria-hidden
					>
						<ChevronsLeftRight className="size-4.5" />
					</span>
				</div>
				<span
					className={cn(TAG, "left-3.5")}
					style={{ opacity: split > 12 ? 1 : 0 }}
				>
					3D scene
				</span>
				<span
					className={cn(TAG, "right-3.5")}
					style={{ opacity: split < 88 ? 1 : 0 }}
				>
					Photoreal
				</span>
			</div>
			<div
				className={cn(
					glass,
					"absolute inset-x-3 top-3 flex h-9.5 items-center gap-2.5 rounded-xl pr-1 pl-3.5",
				)}
			>
				<Dot agent="render" />
				<span className="font-semibold">Photoreal render</span>
				<span className="text-text-2 font-mono text-[11px]">
					{view.model ? `${view.model} · ` : ""}
					{fmtMs(view.ms)}
				</span>
				<span className="text-muted-foreground flex-1 truncate text-right text-[11px]">
					drag to compare · Esc to close
				</span>
				<Button
					variant="outline"
					className="h-7.5 rounded-lg"
					onClick={onClose}
					title="Close (Esc)"
				>
					<X />
					Close
				</Button>
			</div>
		</div>
	);
}
