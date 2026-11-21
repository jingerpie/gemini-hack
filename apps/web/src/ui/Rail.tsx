// Left navigation rail: a floating white pill with one icon per page, shared by every route.
import { cn } from "@gemini-hack/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { House, LayoutGrid, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { Hint } from "./parts";

const item =
	"grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-5";
const active = "bg-muted text-foreground [&_svg]:fill-current";

/** `extra` is a second pill under the nav (page-specific actions such as Undo). */
export function Rail({ extra }: { extra?: ReactNode }) {
	return (
		<nav
			aria-label="Studio"
			className="flex flex-none flex-col items-center gap-3"
		>
			<span className="grid size-11 place-items-center" aria-hidden>
				<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
					<circle
						cx="15"
						cy="15"
						r="11"
						fill="none"
						stroke="var(--primary)"
						strokeWidth="5"
					/>
					<circle cx="15" cy="15" r="3.5" fill="var(--primary)" />
				</svg>
			</span>
			<div className="bg-card flex flex-col gap-1 rounded-full p-1.5 shadow-[var(--shadow-soft)]">
				<Hint label="Studio" side="right">
					<Link
						to="/"
						aria-label="Studio"
						className={item}
						activeProps={{ className: active, "aria-current": "page" }}
						activeOptions={{ exact: true }}
					>
						<House />
					</Link>
				</Hint>
				<Hint label="Model catalog" side="right">
					<Link
						to="/catalog"
						aria-label="Model catalog"
						className={item}
						activeProps={{ className: active, "aria-current": "page" }}
					>
						<LayoutGrid />
					</Link>
				</Hint>
				<Hint label="Checkout" side="right">
					<Link
						to="/checkout"
						aria-label="Checkout"
						className={item}
						activeProps={{ className: active, "aria-current": "page" }}
					>
						<ShoppingBag className="fill-none!" />
					</Link>
				</Hint>
			</div>
			{extra && (
				<div
					className={cn(
						"bg-card mt-2 flex flex-col gap-1 rounded-full p-1.5 shadow-[var(--shadow-soft)]",
					)}
				>
					{extra}
				</div>
			)}
		</nav>
	);
}

export const railButton = item;
