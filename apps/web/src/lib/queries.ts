// TanStack Query: one client per page load, and the query definitions the UI reads.
import { QueryClient, queryOptions } from "@tanstack/react-query";
import type { HealthResponse } from "../types";
import { getJson } from "./api";

export const queryClient = new QueryClient();

/** Configured models from GET /api/health. They change only when the server restarts with other env. */
export const healthQuery = queryOptions({
	queryKey: ["health"],
	queryFn: ({ signal }) => getJson<HealthResponse>("/api/health", signal),
	staleTime: 5 * 60_000,
	retry: 1,
});
