// The checkout cart: every object in the room that is a product, grouped by the store that sells it.
// UI only. Nothing here talks to Shop or creates a real checkout.
import { useMemo, useSyncExternalStore } from "react";
import { manager } from "../lib/studio";
import type { Product, Scene } from "../types";
import { entries, modelRel } from "./data";

export type CartLine = {
	key: string;
	title: string;
	img: string;
	productType: string;
	price: number;
	qty: number;
	similar: boolean;
};
export type CartStore = { name: string; lines: CartLine[]; total: number };
export type Cart = { stores: CartStore[]; itemCount: number; total: number };

const byId = new Map(
	entries.map((e) => [modelRel(e).replace(/\.build\.js$/i, ""), e]),
);

/** "$1,299.00", "1299 USD" -> 1299. Unparseable -> 0. */
const parsePrice = (s: string) =>
	Number(String(s ?? "").replace(/[^\d.]/g, "")) || 0;

function lineOf(p: Product, objectName: string): CartLine {
	const e = p.catalogId ? byId.get(p.catalogId) : undefined;
	return {
		key: p.catalogId || p.variant_id || `${p.store}|${p.title}`,
		title: p.title || e?.name || objectName,
		img: e?.img || p.image_url || "",
		productType: e?.productType || objectName,
		price: e?.price ?? parsePrice(p.price),
		qty: 1,
		similar: !!p.similar,
	};
}

export function cartFromScene(scene: Scene | null): Cart {
	const lines = new Map<string, CartLine & { store: string }>();
	for (const o of scene?.objects ?? []) {
		if (!o.product) continue;
		const l = lineOf(o.product, o.name);
		const store = o.product.store || "Store";
		const id = `${store}|${l.key}`;
		const had = lines.get(id);
		if (had) had.qty += 1;
		else lines.set(id, { ...l, store });
	}
	const all = [...lines.values()];
	const stores = [...new Set(all.map((l) => l.store))].map((name) => {
		const ls = all.filter((l) => l.store === name);
		return {
			name,
			lines: ls,
			total: ls.reduce((a, l) => a + l.price * l.qty, 0),
		};
	});
	return {
		stores,
		itemCount: all.reduce((a, l) => a + l.qty, 0),
		total: stores.reduce((a, s) => a + s.total, 0),
	};
}

/** The cart for the room as it is now; updates as objects are added, swapped or removed. */
export function useRoomCart(): Cart {
	const scene = useSyncExternalStore(manager.subscribe, manager.getRoomScene);
	return useMemo(() => cartFromScene(scene), [scene]);
}

export const fmtUsd = (n: number) =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
		n,
	);
