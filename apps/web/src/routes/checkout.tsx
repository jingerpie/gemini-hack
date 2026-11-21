// Checkout: every product object in the room, as the real Shop listing that will be bought, grouped by store.
// "Check out all" creates one real Shopify checkout per store (POST /api/checkout); each store's Pay link is its
// continue_url, opened unchanged in a new tab. Checkout links carry an access key: never log or store them.
import { Button, buttonVariants } from "@gemini-hack/ui/components/button";
import { Skeleton } from "@gemini-hack/ui/components/skeleton";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	ExternalLink,
	Lock,
	RotateCw,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	type CartItem,
	fmtUsd,
	httpOnly,
	parsePrice,
	useCart,
} from "../lib/cart";
import { manager } from "../lib/studio";
import type { CheckoutResponse } from "../types";
import { Rail } from "../ui/Rail";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type StoreCheckout = CheckoutResponse["checkouts"][number];
type Group = {
	store: string;
	items: CartItem[];
	subtotal: number;
	checkout?: StoreCheckout;
};

const card = "bg-card rounded-[20px] shadow-[var(--shadow-soft)]";
const pillBadge =
	"inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold";

/** One group per store. A checkout is matched to its items by store name; one that matches nothing still gets a group. */
function groupByStore(items: CartItem[], checkouts: StoreCheckout[]): Group[] {
	const groups: Group[] = [];
	for (const it of items) {
		const store = it.product?.store || "Store";
		const price = parsePrice(it.product?.price);
		const g = groups.find((x) => x.store === store);
		if (g) {
			g.items.push(it);
			g.subtotal += price;
		} else groups.push({ store, items: [it], subtotal: price });
	}
	for (const c of checkouts) {
		const g = groups.find((x) => x.store === c.store && !x.checkout);
		if (g) g.checkout = c;
		else groups.push({ store: c.store, items: [], subtotal: 0, checkout: c });
	}
	return groups;
}

function CheckoutPage() {
	const cart = useCart(manager);
	const { checkout, buyable, items } = cart;
	const [opened, setOpened] = useState<Record<string, boolean>>({});

	useEffect(() => {
		document.title = "Checkout";
	}, []);
	// New pay links: nothing has been opened yet.
	useEffect(() => {
		if (checkout.status !== "ready") setOpened({});
	}, [checkout.status]);

	const matching = items.filter((i) => i.status === "matching");
	const unavailable = items.filter(
		(i) => i.status === "none" || i.status === "error",
	);
	const shown = checkout.objectIds.length
		? buyable.filter((i) => checkout.objectIds.includes(i.objectId))
		: buyable;
	const groups = groupByStore(shown, checkout.result?.checkouts ?? []);
	const failed = checkout.result?.failed ?? [];
	const total = groups.reduce((a, g) => a + g.subtotal, 0);

	const ready = checkout.status === "ready";
	const creating = checkout.status === "creating";
	const payable = groups.filter((g) => httpOnly(g.checkout?.url));
	const openedCount = payable.filter((g) => opened[g.store]).length;
	const allOpened =
		ready && payable.length > 0 && openedCount === payable.length;
	const pay = (g: Group) => {
		const url = httpOnly(g.checkout?.url);
		if (!url) return;
		window.open(url, "_blank", "noopener");
		setOpened((o) => ({ ...o, [g.store]: true }));
	};

	return (
		<div className="flex min-h-full flex-wrap items-start gap-4 p-4">
			<Rail />
			<main className="flex max-w-330 min-w-0 flex-[999_1_560px] flex-col gap-6">
				<header className="flex flex-wrap items-end gap-x-5 gap-y-3 pt-1.5">
					<div className="min-w-0 flex-[1_1_320px]">
						<Link
							to="/"
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-semibold"
						>
							<ArrowLeft className="size-4" />
							Back to the room
						</Link>
						<h1 className="mt-1.5 text-4xl leading-[42px] font-bold tracking-[-1.5px]">
							Check out the room
						</h1>
						<p className="text-muted-foreground mt-1 max-w-160 text-base tracking-[-0.5px]">
							Every object in this room, as a real product from the store that
							sells it. One checkout per store. You pay on each store's own
							page.
						</p>
					</div>
					<div
						className={cn(
							card,
							"flex h-11 items-center gap-2.5 rounded-full px-4 text-sm",
						)}
					>
						<span
							className={cn(
								"size-2 rounded-full",
								allOpened
									? "bg-ok"
									: ready
										? "bg-primary"
										: creating || matching.length
											? "bg-primary animate-breathe"
											: "bg-faint",
							)}
						/>
						{ready ? (
							<>
								<b className="font-semibold">
									{allOpened
										? `All ${payable.length}`
										: `${payable.length} of ${groups.length}`}
								</b>
								<span className="text-muted-foreground">
									{allOpened ? "store checkouts opened" : "checkouts ready"}
								</span>
							</>
						) : matching.length ? (
							<>
								<b className="font-semibold">Finding products</b>
								<span className="text-muted-foreground">
									{buyable.length} of {items.length}
								</span>
							</>
						) : (
							<>
								<b className="font-semibold">
									{buyable.length} {buyable.length === 1 ? "item" : "items"}
								</b>
								<span className="text-muted-foreground">
									from {groups.length}{" "}
									{groups.length === 1 ? "store" : "stores"}
								</span>
							</>
						)}
					</div>
				</header>

				<div className="flex flex-wrap items-start gap-4">
					<section
						aria-label="Stores"
						className="flex min-w-0 flex-[999_1_520px] flex-col gap-4"
					>
						{!cart.available && (
							<Notice>
								Checkout isn't available on this server (no Shop connection).
							</Notice>
						)}
						{cart.available && items.length === 0 && (
							<div
								className={cn(
									card,
									"text-muted-foreground flex flex-col items-start gap-3 p-6 text-sm",
								)}
							>
								<b className="text-foreground text-lg font-bold tracking-[-0.5px]">
									Nothing to buy yet
								</b>
								Add furniture from the catalog or ask for a piece in the room.
								Every product placed there shows up here.
								<Button
									nativeButton={false}
									render={<Link to="/" />}
									className="rounded-full"
								>
									Back to the room
								</Button>
							</div>
						)}
						{checkout.status === "error" && (
							<Notice tone="bad">
								<span className="min-w-0 flex-1">
									{checkout.error || "Checkout failed"}
								</span>
								<Button
									variant="outline"
									size="sm"
									className="rounded-full"
									onClick={() => cart.startCheckout(checkout.objectIds)}
								>
									Try again
								</Button>
							</Notice>
						)}

						{groups.map((g) => (
							<StoreCard
								key={g.store}
								g={g}
								ready={ready}
								creating={creating && !g.checkout}
								opened={!!opened[g.store]}
								onPay={() => pay(g)}
							/>
						))}

						{matching.length > 0 && (
							<article className={cn(card, "flex flex-col gap-1 px-5 py-3")}>
								{matching.map((it) => (
									<div
										key={it.objectId}
										className="flex items-center gap-3.5 py-2"
									>
										<Skeleton className="size-16 flex-none rounded-xl" />
										<div className="flex min-w-0 flex-1 flex-col gap-1">
											<b className="truncate text-[15px] font-semibold">
												{it.name}
											</b>
											<span className="text-muted-foreground text-xs">
												Finding the product on Shop…
											</span>
										</div>
									</div>
								))}
							</article>
						)}

						{unavailable.length > 0 && (
							<article className={cn(card, "flex flex-col gap-1 px-5 py-3")}>
								<h2 className="text-muted-foreground pt-1 text-xs font-semibold tracking-wide uppercase">
									Not available to buy
								</h2>
								{unavailable.map((it) => (
									<div
										key={it.objectId}
										className="flex items-center gap-3 py-2 text-sm"
									>
										<span className="min-w-0 flex-1 truncate">
											<b className="font-semibold">{it.name}</b>
											<span className="text-muted-foreground">
												{" "}
												· {it.reason || "no listing found"}
											</span>
										</span>
										<Button
											variant="outline"
											size="sm"
											className="rounded-full"
											onClick={() => cart.retry(it.objectId)}
										>
											<RotateCw />
											Retry
										</Button>
									</div>
								))}
							</article>
						)}

						{failed.map((f) => (
							<Notice key={f.title} tone="warn">
								{f.title}: {f.reason}
							</Notice>
						))}
					</section>

					<aside
						aria-label="Summary"
						className="flex max-w-105 min-w-0 flex-[1_1_320px] flex-col gap-4"
					>
						<div className={cn(card, "flex flex-col gap-4 p-5")}>
							<h2 className="text-xl leading-6 font-bold tracking-[-0.6px]">
								Summary
							</h2>
							<dl className="grid grid-cols-[minmax(0,1fr)_auto] text-sm">
								{groups.map((g) => (
									<div key={g.store} className="contents">
										<dt className="border-border text-muted-foreground truncate border-t py-2.5">
											{g.store}
										</dt>
										<dd className="border-border border-t py-2.5 text-right font-semibold">
											{g.checkout?.total || fmtUsd(g.subtotal)}
										</dd>
									</div>
								))}
								<dt className="border-foreground border-t pt-3 text-base font-bold">
									Items total
								</dt>
								<dd className="border-foreground border-t pt-3 text-right text-xl font-bold tracking-[-0.6px]">
									{fmtUsd(total)}
								</dd>
							</dl>
							<p className="text-muted-foreground text-xs leading-[17px]">
								Listed prices. Each store confirms price, shipping and tax on
								its own page.
							</p>

							{(checkout.status === "idle" || checkout.status === "error") &&
								buyable.length > 0 && (
									<Button
										className="h-13 rounded-full text-base font-semibold tracking-[-0.3px]"
										disabled={matching.length > 0}
										onClick={() => cart.startCheckout()}
									>
										{matching.length
											? "Finding products…"
											: `Check out all · ${groups.length} ${groups.length === 1 ? "store" : "stores"}`}
									</Button>
								)}
							{creating && (
								<Button
									disabled
									aria-busy
									className="h-13 rounded-full text-base font-semibold"
								>
									<Spinner />
									Opening checkouts at {groups.length}{" "}
									{groups.length === 1 ? "store" : "stores"}
								</Button>
							)}
							{ready && (
								<div className="flex flex-col gap-2.5">
									<div className="flex items-center justify-between text-sm">
										<b className="font-semibold">Pay at each store</b>
										<span className="text-muted-foreground">
											{openedCount} of {payable.length} opened
										</span>
									</div>
									<div
										role="progressbar"
										aria-label="Stores opened"
										aria-valuemin={0}
										aria-valuemax={payable.length}
										aria-valuenow={openedCount}
										className="bg-muted h-1.5 overflow-hidden rounded-full"
									>
										<div
											className="bg-ok h-full rounded-full transition-[width]"
											style={{
												width: `${payable.length ? (openedCount / payable.length) * 100 : 0}%`,
											}}
										/>
									</div>
									<ol className="flex flex-col gap-2">
										{payable.map((g, i) => (
											<li key={g.store}>
												<button
													type="button"
													onClick={() => pay(g)}
													className={cn(
														"flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-[14px] pr-3.5 pl-2.5 text-sm transition-colors",
														opened[g.store]
															? "bg-ok/10"
															: "bg-muted hover:bg-accent",
													)}
												>
													<span
														className={cn(
															"grid size-6 flex-none place-items-center rounded-full text-xs font-bold text-white",
															opened[g.store] ? "bg-ok" : "bg-foreground",
														)}
													>
														{opened[g.store] ? (
															<Check className="size-3.5" />
														) : (
															i + 1
														)}
													</span>
													<span className="min-w-0 flex-1 truncate text-left">
														Pay at {g.store}
													</span>
													<span className="font-semibold">
														{g.checkout?.total || fmtUsd(g.subtotal)}
													</span>
												</button>
											</li>
										))}
									</ol>
									<p className="text-muted-foreground text-xs leading-[17px]">
										Each link opens the store's checkout in a new tab. If the
										room changes, the links are dropped and made again.
									</p>
								</div>
							)}
						</div>

						<div className="bg-muted text-text-2 flex gap-3 rounded-2xl px-4 py-3.5 text-[13px] leading-[18px]">
							<Lock className="mt-px size-4.5 flex-none" aria-hidden />
							<span>
								Nothing is charged here. Paying on a store's page places a real
								order with real money.
							</span>
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
}

function Notice({
	children,
	tone = "muted",
}: {
	children: React.ReactNode;
	tone?: "muted" | "warn" | "bad";
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-2xl px-4 py-3 text-sm",
				tone === "bad"
					? "bg-bad/10 text-bad"
					: tone === "warn"
						? "bg-warn/10 text-warn"
						: "bg-muted text-muted-foreground",
			)}
		>
			{children}
		</div>
	);
}

function StoreCard({
	g,
	ready,
	creating,
	opened,
	onPay,
}: {
	g: Group;
	ready: boolean;
	creating: boolean;
	opened: boolean;
	onPay(): void;
}) {
	const c = g.checkout;
	const payUrl = httpOnly(c?.url);
	const count = g.items.length || c?.titles.length || 0;
	const [badge, tone, dot] = opened
		? ["Opened in new tab", "bg-ok/10 text-ok", "bg-ok"]
		: ready && payUrl
			? ["Ready to pay", "bg-primary/10 text-primary", "bg-primary"]
			: creating
				? [
						"Opening checkout",
						"bg-muted text-muted-foreground",
						"bg-faint animate-breathe",
					]
				: ["In your cart", "bg-muted text-muted-foreground", "bg-faint"];

	return (
		<article className={cn(card, "overflow-hidden")}>
			<div className="border-border flex flex-wrap items-center gap-3 border-b px-5 py-4">
				<span className="bg-muted grid size-10 flex-none place-items-center rounded-xl text-[15px] font-bold">
					{g.store.charAt(0)}
				</span>
				<div className="min-w-0 flex-[1_1_200px]">
					<h2 className="text-lg leading-[22px] font-bold tracking-[-0.5px]">
						{g.store}
					</h2>
					<div className="text-muted-foreground text-xs">
						{count} {count === 1 ? "item" : "items"}
					</div>
				</div>
				<span className={cn(pillBadge, tone)}>
					<span className={cn("size-[7px] rounded-full", dot)} />
					{badge}
				</span>
			</div>

			<ul className="px-5 py-1">
				{g.items.map((it) => (
					<ItemRow key={it.objectId} it={it} />
				))}
				{!g.items.length &&
					c?.titles.map((t) => (
						<li
							key={t}
							className="border-muted border-b py-3 text-sm last:border-b-0"
						>
							{t}
						</li>
					))}
			</ul>

			{c?.warnings?.map((w) => (
				<div
					key={w}
					className="bg-warn/10 text-warn mx-5 mt-1 flex gap-2.5 rounded-xl px-3.5 py-3 text-sm"
				>
					<TriangleAlert className="mt-0.5 size-4.5 flex-none" aria-hidden />
					<span>{w}</span>
				</div>
			))}

			<div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 pt-4 pb-4.5">
				<dl className="grid flex-[1_1_220px] grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-[13px]">
					{c?.totals?.length ? (
						c.totals.map((t) => (
							<div key={t.label} className="contents">
								<dt className="text-muted-foreground">{t.label}</dt>
								<dd className="font-semibold tabular-nums">{t.amount}</dd>
							</div>
						))
					) : (
						<>
							<dt className="text-muted-foreground">
								{c?.total ? "Total from store" : "Items"}
							</dt>
							<dd className="text-[15px] font-bold">
								{c?.total || fmtUsd(g.subtotal)}
							</dd>
							<dt className="text-muted-foreground">Shipping and tax</dt>
							<dd className="text-muted-foreground">
								{ready ? "Added on store page" : "Set by the store"}
							</dd>
						</>
					)}
				</dl>
				{c?.links?.length ? (
					<div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
						{c.links.map((l) => {
							const href = httpOnly(l.url);
							return href ? (
								<a
									key={href}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-foreground underline underline-offset-2"
								>
									{l.label}
								</a>
							) : null;
						})}
					</div>
				) : null}
				{ready &&
					(payUrl ? (
						<button
							type="button"
							className={cn(
								buttonVariants(),
								"bg-foreground text-background hover:bg-foreground/85 h-11 rounded-full px-4.5 text-sm font-semibold",
							)}
							onClick={onPay}
						>
							{opened ? `Open ${g.store} again` : `Pay at ${g.store}`}
							<ExternalLink />
						</button>
					) : c ? (
						<span className="text-bad text-sm">No checkout link returned.</span>
					) : null)}
			</div>
		</article>
	);
}

function ItemRow({ it }: { it: CartItem }) {
	const p = it.product;
	if (!p) return null;
	const href = httpOnly(p.url);
	const img = httpOnly(p.image_url);
	const title = String(p.title ?? "").slice(0, 200) || it.name;
	return (
		<li className="border-muted flex items-center gap-3.5 border-b py-3 last:border-b-0">
			<span className="bg-muted block size-16 flex-none overflow-hidden rounded-xl">
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
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="truncate text-[15px] leading-5 font-semibold tracking-[-0.3px] hover:underline"
						title={title}
					>
						{title}
					</a>
				) : (
					<b className="truncate text-[15px] leading-5 font-semibold tracking-[-0.3px]">
						{title}
					</b>
				)}
				<span className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
					For: {it.name} · Qty 1
					{p.similar && (
						<span
							className="bg-warn/10 text-warn inline-flex h-5 items-center rounded-full px-2 font-semibold"
							title="The 3D model is a stand-in; this is the closest real product"
						>
							Closest match
						</span>
					)}
				</span>
			</div>
			<b className="text-[15px] font-semibold whitespace-nowrap">
				{String(p.price ?? "").slice(0, 40)}
			</b>
		</li>
	);
}
