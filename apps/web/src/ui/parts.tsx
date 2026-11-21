// Small pieces shared by the studio UI: agent colour dots, tooltip hints, the frosted "glass" surface.
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@gemini-hack/ui/components/tooltip";
import { cn } from "@gemini-hack/ui/lib/utils";
import type { ReactElement, ReactNode } from "react";

export type Agent =
	| "patch"
	| "designer"
	| "asset"
	| "decal"
	| "source"
	| "render";

const DOT: Record<Agent, string> = {
	patch: "bg-patch text-patch",
	designer: "bg-designer text-designer",
	asset: "bg-asset text-asset",
	decal: "bg-decal text-decal",
	source: "bg-source text-source",
	render: "bg-decal text-decal", // the image model's colour
};

/** Agent colour dot; pulse while that agent is working. */
export function Dot({
	agent,
	pulse,
	className,
}: {
	agent: Agent;
	pulse?: boolean;
	className?: string;
}) {
	return (
		<span
			aria-hidden
			className={cn(
				"inline-block size-1.5 shrink-0 rounded-full",
				DOT[agent],
				pulse && "animate-pulse-dot",
				className,
			)}
		/>
	);
}

/** Frosted surface used by controls that float over the 3D view. */
export const glass =
	"bg-white/75 backdrop-blur-lg backdrop-saturate-125 shadow-[var(--shadow-soft)]";

/** White card lifted off the off-white canvas by a soft shadow (no border). */
export const surface = "bg-card rounded-3xl shadow-[var(--shadow-soft)]";

/** Wrap a control in a tooltip. The child must accept a ref and props (a Button or native element). */
export function Hint({
	label,
	children,
	side = "bottom",
}: {
	label: ReactNode;
	children: ReactElement;
	side?: "top" | "bottom" | "left" | "right";
}) {
	return (
		<Tooltip>
			<TooltipTrigger render={children} />
			<TooltipContent side={side}>{label}</TooltipContent>
		</Tooltip>
	);
}
