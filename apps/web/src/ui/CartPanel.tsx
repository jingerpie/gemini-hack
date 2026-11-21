import { Badge } from "@gemini-hack/ui/components/badge";
import { Button, buttonVariants } from "@gemini-hack/ui/components/button";
import { Card } from "@gemini-hack/ui/components/card";
import { Skeleton } from "@gemini-hack/ui/components/skeleton";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { House } from "lucide-react";
import { type CartItem, useCart } from "../lib/cart";
import type { TaskManager } from "../lib/taskManager";
import type { CheckoutResponse } from "../types";
import { Dot } from "./parts";
import { empty, PanelHead, panel, scroller } from "./Sidebar";

// Listing and checkout urls come from the web: only http(s) is linked, and the string is used exactly as returned.
function httpOnly(u: unknown): string | null {
	return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
}

const muted = "text-muted-foreground text-[11px]";
const tiny =
	"text-muted-foreground hover:text-foreground h-5 rounded-md px-1.5 text-[11px]";

export function CartPanel({ manager }: { manager: TaskManager }) {
	const cart = useCart(manager);
	if (!cart.available) return null;
	const { items, buyable, checkout } = cart;
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
						onBuy={() => cart.startCheckout([it.objectId])}
						onRetry={() => cart.retry(it.objectId)}
						busy={checkout.status === "creating"}
					/>
				))}
			</div>
			{items.length > 0 && (
				<div
					className={cn(
						scroller,
						"border-border flex max-h-[60%] flex-none flex-col gap-1.5 border-t px-3 py-2.5",
					)}
				>
					{checkout.status === "ready" && checkout.result ? (
						<Result result={checkout.result} onReset={cart.resetCheckout} />
					) : (
						<>
							{checkout.status === "error" && (
								<p className="text-bad flex items-center gap-2 text-[11.5px]">
									<span className="min-w-0 flex-1">
										{checkout.error || "Checkout failed"}
									</span>
									<Button
										variant="ghost"
										size="xs"
										className={tiny}
										onClick={() => cart.startCheckout(checkout.objectIds)}
									>
										Try again
									</Button>
								</p>
							)}
							<Button
								className="h-8 w-full rounded-md"
								disabled={!buyable.length || checkout.status === "creating"}
								onClick={() => cart.startCheckout()}
							>
								{checkout.status === "creating" && <Spinner />}
								Checkout · {buyable.length}{" "}
								{buyable.length === 1 ? "item" : "items"}
							</Button>
							<p className={muted}>
								Real checkout. You pay on each store's own page.
							</p>
						</>
					)}
				</div>
			)}
		</Card>
	);
}

function Row({
	it,
	onBuy,
	onRetry,
	busy,
}: {
	it: CartItem;
	onBuy(): void;
	onRetry(): void;
	busy: boolean;
}) {
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
			<div className="flex flex-none flex-col items-end gap-0.5">
				<b className="font-mono text-[11px] font-semibold text-[#e2c597] tabular-nums">
					{String(p.price ?? "").slice(0, 40)}
				</b>
				<Button
					variant="ghost"
					size="xs"
					className={tiny}
					disabled={busy}
					onClick={onBuy}
				>
					Buy
				</Button>
			</div>
		</div>
	);
}

function Result({
	result,
	onReset,
}: {
	result: CheckoutResponse;
	onReset(): void;
}) {
	const { checkouts, failed = [] } = result;
	return (
		<div className="flex flex-col gap-2">
			{checkouts.length > 1 && <p className={muted}>One checkout per store.</p>}
			{checkouts.map((c, i) => {
				const pay = httpOnly(c.url);
				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: one block per merchant, the list never reorders
						key={i}
						className="border-border bg-muted flex flex-col gap-1 rounded-[9px] border p-2"
					>
						<div className="flex items-baseline gap-2">
							<span className="text-foreground min-w-0 flex-1 truncate text-[12px] font-semibold">
								{c.store}
							</span>
							{c.similar && <span className={muted}>closest match</span>}
						</div>
						<p className={cn(muted, "line-clamp-2")}>{c.titles.join(" · ")}</p>
						{c.totals?.length ? (
							c.totals.map((t) => (
								<p
									key={t.label}
									className="text-text-2 flex justify-between text-[11px] tabular-nums"
								>
									<span>{t.label}</span>
									<span className="font-mono">{t.amount}</span>
								</p>
							))
						) : c.total ? (
							<p className="text-text-2 flex justify-between text-[11px] tabular-nums">
								<span>Total</span>
								<span className="font-mono">{c.total}</span>
							</p>
						) : null}
						{c.warnings?.map((w) => (
							<p key={w} className="text-warn text-[11px] leading-snug">
								{w}
							</p>
						))}
						{c.links?.length ? (
							<p className="flex flex-wrap gap-x-2.5 text-[10.5px]">
								{c.links.map((l) =>
									httpOnly(l.url) ? (
										<a
											key={l.url}
											href={l.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-foreground underline underline-offset-2"
										>
											{l.label}
										</a>
									) : null,
								)}
							</p>
						) : null}
						{pay ? (
							<a
								href={pay}
								target="_blank"
								rel="noopener"
								className={cn(buttonVariants(), "mt-0.5 h-8 w-full rounded-md")}
							>
								Pay at {c.store}
							</a>
						) : (
							<p className="text-bad text-[11px]">No checkout link returned.</p>
						)}
					</div>
				);
			})}
			{failed.map((f) => (
				<p key={f.title} className={muted}>
					{f.title}: {f.reason}
				</p>
			))}
			<Button
				variant="ghost"
				size="xs"
				className={cn(tiny, "self-start")}
				onClick={onReset}
			>
				Start over
			</Button>
		</div>
	);
}
