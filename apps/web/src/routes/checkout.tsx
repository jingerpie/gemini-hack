// Checkout: every object in the room, grouped by the store that sells it, with one "Check out all" button.
// UI only: the cart is demo data and the pay buttons open nothing. Real checkouts (Shop MCP) are not wired here.
import { Button } from "@gemini-hack/ui/components/button";
import { Spinner } from "@gemini-hack/ui/components/spinner";
import { cn } from "@gemini-hack/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	ExternalLink,
	Lock,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	type CartStore,
	demoItemCount,
	demoStores,
	demoTotal,
	fmtUsd,
} from "../catalog/demoCart";
import { Rail } from "../ui/Rail";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type Phase = "review" | "creating" | "ready";

const card = "bg-card rounded-[20px] shadow-[var(--shadow-soft)]";
const pillBadge =
	"inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold";

function CheckoutPage() {
	const [phase, setPhase] = useState<Phase>("review");
	const [opened, setOpened] = useState<Record<string, boolean>>({});
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		document.title = "Checkout";
		return () => clearTimeout(timer.current);
	}, []);

	const checkoutAll = () => {
		setPhase("creating");
		timer.current = setTimeout(() => setPhase("ready"), 1100);
	};
	const pay = (store: string) => setOpened((o) => ({ ...o, [store]: true }));

	const ready = phase === "ready";
	const openedCount = demoStores.filter((s) => opened[s.name]).length;
	const allOpened = ready && openedCount === demoStores.length;

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
							Every object in this room, from the stores that sell it. One
							checkout per store. You pay on each store's own page.
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
										: phase === "creating"
											? "bg-primary animate-breathe"
											: "bg-faint",
							)}
						/>
						{ready ? (
							<>
								<b className="font-semibold">
									{allOpened
										? `All ${demoStores.length}`
										: `${demoStores.length} of ${demoStores.length}`}
								</b>
								<span className="text-muted-foreground">
									{allOpened ? "store checkouts opened" : "checkouts ready"}
								</span>
							</>
						) : (
							<>
								<b className="font-semibold">{demoItemCount} items</b>
								<span className="text-muted-foreground">
									from {demoStores.length} stores
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
						{demoStores.map((s) => (
							<StoreCard
								key={s.name}
								store={s}
								phase={phase}
								opened={!!opened[s.name]}
								onPay={() => pay(s.name)}
							/>
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
								{demoStores.map((s) => (
									<div key={s.name} className="contents">
										<dt className="border-border text-muted-foreground truncate border-t py-2.5">
											{s.name}
										</dt>
										<dd className="border-border border-t py-2.5 text-right font-semibold">
											{fmtUsd(s.total)}
										</dd>
									</div>
								))}
								<dt className="border-foreground border-t pt-3 text-base font-bold">
									Items total
								</dt>
								<dd className="border-foreground border-t pt-3 text-right text-xl font-bold tracking-[-0.6px]">
									{fmtUsd(demoTotal)}
								</dd>
							</dl>
							<p className="text-muted-foreground text-xs leading-[17px]">
								Shipping and tax are set by each store when you add your address
								on its page.
							</p>

							{phase === "review" && (
								<Button
									className="h-13 rounded-full text-base font-semibold tracking-[-0.3px]"
									onClick={checkoutAll}
								>
									Check out all · {demoStores.length} stores
								</Button>
							)}
							{phase === "creating" && (
								<Button
									disabled
									aria-busy
									className="h-13 rounded-full text-base font-semibold"
								>
									<Spinner />
									Opening checkouts at {demoStores.length} stores
								</Button>
							)}
							{ready && (
								<div className="flex flex-col gap-2.5">
									<div className="flex items-center justify-between text-sm">
										<b className="font-semibold">Pay at each store</b>
										<span className="text-muted-foreground">
											{openedCount} of {demoStores.length} opened
										</span>
									</div>
									<div
										role="progressbar"
										aria-label="Stores opened"
										aria-valuemin={0}
										aria-valuemax={demoStores.length}
										aria-valuenow={openedCount}
										className="bg-muted h-1.5 overflow-hidden rounded-full"
									>
										<div
											className="bg-ok h-full rounded-full transition-[width]"
											style={{
												width: `${(openedCount / demoStores.length) * 100}%`,
											}}
										/>
									</div>
									<ol className="flex flex-col gap-2">
										{demoStores.map((s, i) => (
											<li key={s.name}>
												<button
													type="button"
													onClick={() => pay(s.name)}
													className={cn(
														"flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-[14px] pr-3.5 pl-2.5 text-sm transition-colors",
														opened[s.name]
															? "bg-ok/10"
															: "bg-muted hover:bg-accent",
													)}
												>
													<span
														className={cn(
															"grid size-6 flex-none place-items-center rounded-full text-xs font-bold text-white",
															opened[s.name] ? "bg-ok" : "bg-foreground",
														)}
													>
														{opened[s.name] ? (
															<Check className="size-3.5" />
														) : (
															i + 1
														)}
													</span>
													<span className="min-w-0 flex-1 truncate text-left">
														Pay at {s.name}
													</span>
													<span className="font-semibold">
														{fmtUsd(s.total)}
													</span>
												</button>
											</li>
										))}
									</ol>
									<p className="text-muted-foreground text-xs leading-[17px]">
										Each link opens the store's checkout in a new tab. Links
										stay valid while this cart is unchanged.
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

function StoreCard({
	store,
	phase,
	opened,
	onPay,
}: {
	store: CartStore;
	phase: Phase;
	opened: boolean;
	onPay(): void;
}) {
	const ready = phase === "ready";
	const count = store.lines.reduce((a, l) => a + l.qty, 0);
	const [badge, tone, dot] = opened
		? ["Opened in new tab", "bg-ok/10 text-ok", "bg-ok"]
		: ready
			? ["Ready to pay", "bg-primary/10 text-primary", "bg-primary"]
			: phase === "creating"
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
					{store.name.charAt(0)}
				</span>
				<div className="min-w-0 flex-[1_1_200px]">
					<h2 className="text-lg leading-[22px] font-bold tracking-[-0.5px]">
						{store.name}
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
				{store.lines.map((l) => (
					<li
						key={l.item.index}
						className="border-muted flex items-center gap-3.5 border-b py-3 last:border-b-0"
					>
						<img
							src={l.item.img}
							alt=""
							className="bg-muted size-16 flex-none rounded-xl object-cover"
						/>
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<b className="truncate text-[15px] leading-5 font-semibold tracking-[-0.3px]">
								{l.item.name}
							</b>
							<span className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
								{l.item.productType} · Qty {l.qty}
								{l.similar && (
									<span className="bg-warn/10 text-warn inline-flex h-5 items-center rounded-full px-2 font-semibold">
										Closest match
									</span>
								)}
							</span>
						</div>
						<b className="text-[15px] font-semibold whitespace-nowrap">
							{fmtUsd(l.item.price * l.qty)}
						</b>
					</li>
				))}
			</ul>

			{ready && store.warning && (
				<div className="bg-warn/10 text-warn mx-5 mt-1 flex gap-2.5 rounded-xl px-3.5 py-3 text-sm">
					<TriangleAlert className="mt-0.5 size-4.5 flex-none" aria-hidden />
					<span>{store.warning}</span>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 pt-4 pb-4.5">
				<dl className="grid flex-[1_1_220px] grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-[13px]">
					<dt className="text-muted-foreground">
						{ready ? "Subtotal from store" : "Items"}
					</dt>
					<dd className="text-[15px] font-bold">{fmtUsd(store.total)}</dd>
					<dt className="text-muted-foreground">Shipping and tax</dt>
					<dd className="text-muted-foreground">
						{ready ? "Added on store page" : "Set by the store"}
					</dd>
				</dl>
				<div className="text-muted-foreground flex gap-3 text-xs">
					<span>Refunds</span>
					<span>Shipping</span>
					<span>Terms</span>
				</div>
				{ready && (
					<Button
						className="bg-foreground text-background hover:bg-foreground/85 h-11 rounded-full px-4.5 text-sm font-semibold"
						onClick={onPay}
					>
						{opened ? `Open ${store.name} again` : `Pay at ${store.name}`}
						<ExternalLink />
					</Button>
				)}
			</div>
		</article>
	);
}
