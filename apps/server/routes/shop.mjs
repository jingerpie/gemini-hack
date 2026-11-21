// GET  /api/shop/search?q=...&limit=3&model=1   -> ShopSearchResponse { products, ms }
// POST /api/checkout  (CheckoutRequest)          -> CheckoutResponse
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { note, readJson } from "../http.mjs";
import { shopCheckout, shopSearch } from "../shop.mjs";

// Shop answers are per-user (checkout URLs carry access keys): never cache them.
const noStore = async (c, next) => {
	await next();
	c.header("Cache-Control", "no-store");
};

export const shopRoutes = new Hono()
	.get("/shop/search", noStore, async (c) => {
		const q = c.req.query("q") || "";
		if (!q.trim()) return c.json({ error: "q required" }, 400);
		try {
			const out = await shopSearch(q, {
				limit: +(c.req.query("limit") || 3),
				model3d: c.req.query("model") === "1",
			});
			note(
				c,
				`"${q.slice(0, 50)}" -> ${out.products.length} products ${out.ms}ms`,
			);
			return c.json({ products: out.products, ms: out.ms });
		} catch (e) {
			note(c, `"${q.slice(0, 50)}" -> ERROR ${e.code || ""} ${e.message}`);
			return c.json(
				{ error: e.message, code: e.code },
				e.code === "bad_query" ? 400 : 502,
			);
		}
	})
	.post(
		"/checkout",
		noStore,
		bodyLimit({
			maxSize: 1024 * 1024,
			onError: (c) => c.json({ error: "body too large" }, 413),
		}),
		async (c) => {
			const body = await readJson(c);
			if (!Array.isArray(body.items) || !body.items.length)
				return c.json({ error: "items required" }, 400);
			const out = await shopCheckout(body.items);
			// Never log continue_url: it carries the checkout's access key (checkout.md).
			note(
				c,
				`${body.items.length} items -> ${out.checkouts.length} checkouts (${out.checkouts.map((s) => s.store).join(", ")}), ${out.failed.length} failed, ${out.ms}ms`,
			);
			return c.json(out);
		},
	);
