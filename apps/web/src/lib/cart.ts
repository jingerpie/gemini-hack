// The cart: exactly one real, buyable Shop listing per product object in the room, and a checkout over them.
// Room objects come from the live scene (TaskManager.subscribeScene); matches are TanStack queries, one per object.
// Checkout links carry an access key: never log them, store them or put them in the URL.
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckoutResponse, Product, Scene } from "../types";
import { type Api, NotAvailableError } from "./api";
import { type ShopMatchItem, shopMatchQuery } from "./queries";
import type { TaskManager } from "./taskManager";

export type CartItem = {
	objectId: string;
	name: string; // the room object's name
	status: "matching" | "ready" | "none" | "error";
	product?: Product; // status "ready": the one Shop listing for this object (has variant_id and shop)
	reason?: string; // status "none" / "error"
};
export type CartCheckout = {
	status: "idle" | "creating" | "ready" | "error";
	result?: CheckoutResponse; // status "ready"
	error?: string; // status "error"
	objectIds: string[]; // the objects this checkout covers
};
export type Cart = {
	available: boolean; // false when the server has no /api/shop/match (404/405): the panel hides itself
	items: CartItem[]; // one per object in the room, in room order
	buyable: CartItem[]; // the items with status "ready"
	checkout: CartCheckout;
	startCheckout(objectIds?: string[]): void; // default: every buyable item
	resetCheckout(): void;
	retry(objectId: string): void; // re-run the match for one object
};

type Room = { key: string; items: ShopMatchItem[]; api: Api | null };

/** Product objects only: plain primitive boxes get no listing. */
function roomItems(scene: Scene | null): ShopMatchItem[] {
	if (!scene) return [];
	return scene.objects
		.filter((o) => o.shape === "custom")
		.map((o) => ({
			objectId: o.id,
			name: o.name,
			description: o.description,
			catalogId: o.product?.catalogId,
			color: o.color,
		}));
}

export function useCart(manager: TaskManager): Cart {
	const queryClient = useQueryClient();
	const [room, setRoom] = useState<Room>(() => {
		const items = roomItems(manager.getScene());
		return { key: JSON.stringify(items), items, api: manager.getApi() };
	});

	// Re-render only when the product objects change, not on every move / animation-driven scene update.
	useEffect(() => {
		const update = (scene: Scene | null) => {
			const items = roomItems(scene);
			const key = JSON.stringify(items);
			const api = manager.getApi();
			setRoom((prev) =>
				prev.key === key && prev.api === api ? prev : { key, items, api },
			);
		};
		update(manager.getScene());
		return manager.subscribeScene(update);
	}, [manager]);

	const results = useQueries({
		queries: room.items.map((item) => shopMatchQuery(room.api, item)),
	});

	let available = !!room.api?.shopMatch;
	const items: CartItem[] = room.items.map((item, i) => {
		const r = results[i];
		const base = { objectId: item.objectId, name: item.name };
		if (r.isError) {
			if (r.error instanceof NotAvailableError) available = false;
			return { ...base, status: "error", reason: r.error.message };
		}
		if (!r.data) return { ...base, status: "matching" };
		const p = r.data.product;
		if (p?.variant_id && p.shop)
			return { ...base, status: "ready", product: p };
		return {
			...base,
			status: "none",
			reason:
				r.data.reason ?? (p ? "listing is not buyable" : "no listing found"),
		};
	});
	const buyable = items.filter((i) => i.status === "ready");

	const mutation = useMutation({
		mutationFn: async (chosen: CartItem[]) => {
			const api = room.api;
			if (!api?.checkout) throw new Error("checkout not available");
			return api.checkout({
				items: chosen.map((i) => ({
					variantId: i.product?.variant_id,
					shop: i.product?.shop,
					title: i.product?.title,
					store: i.product?.store,
					quantity: 1,
				})),
			});
		},
	});
	const { reset, mutate } = mutation;

	// A created checkout must never go stale silently: when the buyable set changes, drop the old links.
	const buyableKey = buyable
		.map(
			(i) =>
				`${i.objectId}\u0000${i.product?.variant_id}\u0000${i.product?.shop}`,
		)
		.join("\u0001");
	const lastKey = useRef(buyableKey);
	useEffect(() => {
		if (lastKey.current === buyableKey) return;
		lastKey.current = buyableKey;
		reset();
	}, [buyableKey, reset]);

	const startCheckout = useCallback(
		(objectIds?: string[]) => {
			const chosen = objectIds
				? buyable.filter((i) => objectIds.includes(i.objectId))
				: buyable;
			if (chosen.length) mutate(chosen);
		},
		// buyableKey identifies `buyable`'s content
		// biome-ignore lint/correctness/useExhaustiveDependencies: buyable is rebuilt every render
		[buyableKey, mutate],
	);

	const retry = useCallback(
		(objectId: string) => {
			void queryClient.resetQueries({ queryKey: ["shop-match", objectId] });
		},
		[queryClient],
	);

	const checkout: CartCheckout = {
		status:
			mutation.status === "pending"
				? "creating"
				: mutation.status === "success"
					? "ready"
					: mutation.status,
		result: mutation.data,
		error: mutation.error?.message,
		objectIds: mutation.variables?.map((i) => i.objectId) ?? [],
	};

	return {
		available,
		items,
		buyable,
		checkout,
		startCheckout,
		resetCheckout: reset,
		retry,
	};
}
