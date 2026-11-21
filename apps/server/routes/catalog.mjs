// GET /api/catalog -> CatalogResponse { items }
import { Hono } from "hono";
import { loadCatalog } from "../catalog.mjs";

export const catalogRoutes = new Hono().get("/catalog", (c) => {
	c.header("Cache-Control", "public, max-age=300");
	return c.json({ items: loadCatalog() });
});
