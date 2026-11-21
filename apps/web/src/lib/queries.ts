// TanStack Query: one client per page load, and the query definitions the UI reads.
import { QueryClient, queryOptions } from "@tanstack/react-query";
import type { HealthResponse, ShopMatchRequest } from "../types";
import { type Api, getJson, NotAvailableError } from "./api";

export const queryClient = new QueryClient();

/** Configured models from GET /api/health. They change only when the server restarts with other env. */
export const healthQuery = queryOptions({
	queryKey: ["health"],
	queryFn: ({ signal }) => getJson<HealthResponse>("/api/health", signal),
	staleTime: 5 * 60_000,
	retry: 1,
});

export type ShopMatchItem = ShopMatchRequest["items"][number];

/** The one buyable Shop listing for a room object. Keyed per object, so adding an object fetches only that one,
 *  and swapping its catalog item refetches only it. Description and colour are hints, not part of the key. */
export const shopMatchQuery = (api: Api | null, item: ShopMatchItem) =>
	queryOptions({
		queryKey: ["shop-match", item.objectId, item.name, item.catalogId ?? ""],
		queryFn: async ({ signal }) => {
			if (!api?.shopMatch) throw new NotAvailableError("/api/shop/match");
			const res = await api.shopMatch({ items: [item] }, signal);
			return (
				res.matches.find((m) => m.objectId === item.objectId) ?? {
					objectId: item.objectId,
					product: null,
					reason: "no match returned",
				}
			);
		},
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 60_000, // removed objects drop out of the cache
		retry: (count, err) => !(err instanceof NotAvailableError) && count < 1,
		refetchOnWindowFocus: false,
	});
