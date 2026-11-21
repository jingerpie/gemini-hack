// Demo cart for the checkout page: a fixed set of catalog listings, grouped by store.
// UI only. Nothing here talks to Shop or creates a real checkout.
import { entries, type Item } from "./data";

export type CartLine = { item: Item; qty: number; similar: boolean };
export type CartStore = {
	name: string;
	lines: CartLine[];
	total: number;
	/** Shown once checkouts are "ready", the way a merchant warning would be. */
	warning?: string;
};

const PICKS: { name: string; qty?: number; similar?: boolean }[] = [
	{ name: "Oak Lounge Armchair" },
	{ name: "Crest", qty: 2 },
	{ name: "Reclaimed Wood Coffee Table", similar: true },
	{ name: "Three-Leg Companion" },
	{ name: "Build-a-Lounge", similar: true },
	{ name: "Overhang" },
];

const WARNINGS: Record<string, string> = {
	"Field & Trestle":
		"Reclaimed Wood Coffee Table: only 2 left. The store confirms stock when you pay.",
};

const lines: CartLine[] = PICKS.flatMap((p) => {
	const item = entries.find((e) => e.name === p.name);
	return item ? [{ item, qty: p.qty ?? 1, similar: !!p.similar }] : [];
});

export const demoStores: CartStore[] = [
	...new Set(lines.map((l) => l.item.vendor)),
].map((name) => {
	const ls = lines.filter((l) => l.item.vendor === name);
	return {
		name,
		lines: ls,
		total: ls.reduce((a, l) => a + l.item.price * l.qty, 0),
		warning: WARNINGS[name],
	};
});

export const demoItemCount = lines.reduce((a, l) => a + l.qty, 0);
export const demoTotal = demoStores.reduce((a, s) => a + s.total, 0);
export const fmtUsd = (n: number) =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
		n,
	);
