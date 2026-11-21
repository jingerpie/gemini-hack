// The cart page: every listing being bought, grouped by store, with that store's totals and pay link.
// Shop allows one checkout per merchant and has no cross-store cart page, so this page is ours and each store
// gets its own "Pay" link. It is a full-screen dialog over the studio (the room stays mounted underneath).
import { Badge } from "@gemini-hack/ui/components/badge";
import { Button, buttonVariants } from "@gemini-hack/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@gemini-hack/ui/components/dialog";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Cart, CartItem } from "../lib/cart";
import type { CheckoutResponse } from "../types";

type StoreCheckout = CheckoutResponse["checkouts"][number];
type Group = { store: string; items: CartItem[]; checkout?: StoreCheckout };

// Listing and checkout urls come from the web: only http(s) is linked, and the string is used exactly as returned.
export function httpOnly(u: unknown): string | null {
	return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
}

/** One group per store. A checkout is matched to its items by store name; one that matches nothing still gets a group. */
function groupByStore(items: CartItem[], checkouts: StoreCheckout[]): Group[] {
	const groups: Group[] = [];
	for (const it of items) {
		const store = it.product?.store || "Store";
		const g = groups.find((x) => x.store === store);
		if (g) g.items.push(it);
		else groups.push({ store, items: [it] });
	}
	for (const c of checkouts) {
		const g = groups.find((x) => x.store === c.store && !x.checkout);
		if (g) g.checkout = c;
		else groups.push({ store: c.store, items: [], checkout: c });
	}
	return groups;
}

export function CartPage({ cart, onClose }: { cart: Cart; onClose(): void }) {
	const { checkout, buyable } = cart;

	const items = checkout.objectIds.length
		? buyable.filter((i) => checkout.objectIds.includes(i.objectId))
		: buyable;
	const groups = groupByStore(items, checkout.result?.checkouts ?? []);
	const failed = checkout.result?.failed ?? [];

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				showCloseButton={false}
				className="bg-background text-foreground block h-screen w-screen max-w-none overflow-y-auto rounded-none p-0 sm:max-w-none"
			>
				<div className="mx-auto flex max-w-[860px] flex-col gap-5 px-6 py-8">
					<header className="flex items-center gap-4">
						<div className="min-w-0 flex-1">
							<DialogTitle className="text-[26px] leading-tight font-semibold">
								Your cart
							</DialogTitle>
							<p className="text-muted-foreground text-[13px]">
								{items.length} {items.length === 1 ? "item" : "items"} from{" "}
								{groups.length} {groups.length === 1 ? "store" : "stores"}
							</p>
						</div>
						<Button variant="outline" onClick={onClose}>
							<ArrowLeft /> Back to studio
						</Button>
					</header>

					{checkout.status === "error" && (
						<p className="text-bad flex items-center gap-3 text-[13px]">
							<span className="min-w-0 flex-1">
								{checkout.error || "Checkout failed"}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => cart.startCheckout(checkout.objectIds)}
							>
								Try again
							</Button>
						</p>
					)}
					{checkout.status === "idle" && (
						<p className="text-muted-foreground flex items-center gap-3 text-[13px]">
							<span className="min-w-0 flex-1">
								The room changed, so the pay links were dropped.
							</span>
							<Button
								size="sm"
								disabled={!buyable.length}
								onClick={() => cart.startCheckout()}
							>
								Create checkout
							</Button>
						</p>
					)}

					{groups.map((g, i) => (
						<StoreSection
							key={i}
							g={g}
							creating={checkout.status === "creating"}
						/>
					))}

					{failed.map((f) => (
						<p key={f.title} className="text-muted-foreground text-[12.5px]">
							{f.title}: {f.reason}
						</p>
					))}

					<p className="text-muted-foreground text-[12.5px]">
						Real checkout. Each store takes payment on its own page, so there is
						one Pay button per store.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function StoreSection({ g, creating }: { g: Group; creating: boolean }) {
	const c = g.checkout;
	const pay = httpOnly(c?.url);
	return (
		<section className="border-border bg-muted flex flex-col gap-3 rounded-xl border p-4">
			<h2 className="text-[15px] font-semibold">{g.store}</h2>

			{g.items.map((it) => (
				<ItemRow key={it.objectId} it={it} />
			))}
			{!g.items.length &&
				c?.titles.map((t) => (
					<p key={t} className="text-text-2 text-[13px]">
						{t}
					</p>
				))}

			<div className="border-border flex flex-col gap-1.5 border-t pt-3">
				{creating && !c && (
					<p className="text-muted-foreground flex items-center gap-2 text-[13px]">
						<Spinner /> Creating checkout…
					</p>
				)}
				{c?.totals?.length ? (
					c.totals.map((t) => (
						<p
							key={t.label}
							className="text-text-2 flex justify-between text-[13px] tabular-nums"
						>
							<span>{t.label}</span>
							<span className="font-mono">{t.amount}</span>
						</p>
					))
				) : c?.total ? (
					<p className="text-text-2 flex justify-between text-[13px] tabular-nums">
						<span>Total</span>
						<span className="font-mono">{c.total}</span>
					</p>
				) : null}
				{c?.warnings?.map((w) => (
					<p key={w} className="text-warn text-[12.5px] leading-snug">
						{w}
					</p>
				))}
				{c?.links?.length ? (
					<p className="flex flex-wrap gap-x-3 text-[11.5px]">
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
						className={cn(
							buttonVariants(),
							"mt-1 h-10 w-full rounded-md text-[14px]",
						)}
					>
						Pay at {g.store}
					</a>
				) : c ? (
					<p className="text-bad text-[12.5px]">No checkout link returned.</p>
				) : null}
			</div>
		</section>
	);
}

function ItemRow({ it }: { it: CartItem }) {
	const p = it.product;
	if (!p) return null;
	const href = httpOnly(p.url);
	const img = httpOnly(p.image_url);
	const title = String(p.title ?? "").slice(0, 200) || it.name;
	return (
		<div className="flex items-start gap-3.5">
			<span className="block size-18 flex-none overflow-hidden rounded-lg bg-[#f2f1ee]">
				{img && (
					<img
						src={img}
						alt=""
						loading="lazy"
						referrerPolicy="no-referrer"
						className="block size-full object-cover"
					/>
				)}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="line-clamp-2 text-[14px] leading-snug hover:underline"
						title={title}
					>
						{title}
					</a>
				) : (
					<span className="line-clamp-2 text-[14px] leading-snug">{title}</span>
				)}
				<span className="text-muted-foreground flex items-center gap-2 text-[12px]">
					<span className="truncate">for: {it.name}</span>
					{p.similar && (
						<Badge
							className="text-text-2 h-4.5 flex-none rounded bg-white/6 px-1.5 text-[10.5px]"
							title="The 3D model is a stand-in; this is the closest real product"
						>
							closest match
						</Badge>
					)}
					<span className="flex-none">× 1</span>
				</span>
			</div>
			<b className="flex-none font-mono text-[14px] font-semibold text-[#e2c597] tabular-nums">
				{String(p.price ?? "").slice(0, 40)}
			</b>
		</div>
	);
}
