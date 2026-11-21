import { Badge } from "@gemini-hack/ui/components/badge";
import { Button } from "@gemini-hack/ui/components/button";
import { Card } from "@gemini-hack/ui/components/card";
import { Skeleton } from "@gemini-hack/ui/components/skeleton";
import { cn } from "@gemini-hack/ui/lib/utils";
import { House } from "lucide-react";
import { useCallback, useState } from "react";
import { type CartItem, useCart } from "../lib/cart";
import type { TaskManager } from "../lib/taskManager";
import { CartPage, httpOnly } from "./CartPage";
import { Dot } from "./parts";
import { empty, PanelHead, panel, scroller } from "./Sidebar";

const muted = "text-muted-foreground text-[11px]";
const tiny =
	"text-muted-foreground hover:text-foreground h-5 rounded-md px-1.5 text-[11px]";

export function CartPanel({ manager }: { manager: TaskManager }) {
	const cart = useCart(manager);
	const [pageOpen, setPageOpen] = useState(false);
	const closePage = useCallback(() => setPageOpen(false), []);
	if (!cart.available) return null;
	const { items, buyable, checkout } = cart;
	// A checkout that is being made or is ready is reused: the button reopens the page instead of creating another.
	const reuse = checkout.status === "creating" || checkout.status === "ready";
	return (
		<Card
			className={cn(
				panel,
				items.length ? "min-h-37 flex-[1_1_0]" : "flex-none",
			)}
		>
			<PanelHead
				title={
					<>
						<Dot agent="source" className="size-[7px]" /> In this room
					</>
				}
				meta={items.length || ""}
			/>
			<div className={cn(scroller, "flex flex-col gap-1.5 px-2.5 pt-2 pb-2.5")}>
				{!items.length && (
					<p className={cn(empty, "px-1 py-0.5")}>
						Add something and it shows up here.
					</p>
				)}
				{items.map((it) => (
					<Row
						key={it.objectId}
						it={it}
						onRetry={() => cart.retry(it.objectId)}
					/>
				))}
			</div>
			{items.length > 0 && (
				<div className="border-border flex flex-none flex-col gap-1.5 border-t px-3 py-2.5">
					<Button
						className="h-8 w-full rounded-md"
						disabled={!buyable.length}
						onClick={() => {
							if (!reuse) cart.startCheckout();
							setPageOpen(true);
						}}
					>
						{reuse ? "View cart" : "Checkout"} · {buyable.length}{" "}
						{buyable.length === 1 ? "item" : "items"}
					</Button>
					<p className={muted}>
						Real checkout. You pay on each store's own page.
					</p>
				</div>
			)}
			{pageOpen && <CartPage cart={cart} onClose={closePage} />}
		</Card>
	);
}

function Row({ it, onRetry }: { it: CartItem; onRetry(): void }) {
	const box =
		"border-border bg-muted flex flex-none items-center gap-2.5 rounded-[9px] border py-1.5 pr-2 pl-1.5";
	if (it.status === "matching")
		return (
			<div className={box}>
				<Skeleton className="size-11 flex-none rounded-md" />
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="text-text-2 truncate text-[11.5px]">{it.name}</span>
					<Skeleton className="h-2.5 w-2/3 rounded" />
				</div>
			</div>
		);
	if (it.status !== "ready" || !it.product)
		return (
			<div className={cn(box, "opacity-75")}>
				<span className={cn(muted, "min-w-0 flex-1 truncate pl-1")}>
					<span className="text-text-2">{it.name}</span> ·{" "}
					{it.status === "error" ? "search failed" : "no listing found"}
				</span>
				<Button variant="ghost" size="xs" className={tiny} onClick={onRetry}>
					retry
				</Button>
			</div>
		);
	const p = it.product;
	const href = httpOnly(p.url);
	const img = httpOnly(p.image_url);
	const title = String(p.title ?? "").slice(0, 200) || it.name;
	return (
		<div className={box}>
			<span className="block size-11 flex-none overflow-hidden rounded-md bg-[#f2f1ee]">
				{img ? (
					<img
						src={img}
						alt=""
						loading="lazy"
						referrerPolicy="no-referrer"
						className="block size-full object-cover"
					/>
				) : (
					<span
						className="text-faint grid size-full place-items-center bg-[#22252c]"
						aria-hidden
					>
						<House className="size-5" />
					</span>
				)}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="text-foreground line-clamp-2 text-[11.5px] leading-tight hover:underline"
						title={title}
					>
						{title}
					</a>
				) : (
					<span className="text-foreground line-clamp-2 text-[11.5px] leading-tight">
						{title}
					</span>
				)}
				<span className="flex min-w-0 items-center gap-1.5 text-[10.5px]">
					<span className="text-muted-foreground truncate">
						{String(p.store ?? "").slice(0, 60)}
					</span>
					{p.similar && (
						<Badge
							className="text-text-2 h-4 flex-none rounded bg-white/6 px-1.5 text-[9.5px]"
							title="The 3D model is a stand-in; this is the closest real product"
						>
							closest match
						</Badge>
					)}
				</span>
			</div>
			<b className="flex-none font-mono text-[11px] font-semibold text-[#e2c597] tabular-nums">
				{String(p.price ?? "").slice(0, 40)}
			</b>
		</div>
	);
}
