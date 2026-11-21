// Studio backend routes (Hono). index.mjs serves this app on Node; tests can call app.request() directly.
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { assetConfig, buildAsset } from "./asset.mjs";
import { note, readJson, sse } from "./http.mjs";
import { stats as geminiStats, scrub } from "./lib.mjs";
import {
	DECISION_MODEL,
	decal,
	IMAGE_MODEL,
	LIVE_MODEL,
	token,
	verify,
} from "./media.mjs";
import { DESIGNER_MODEL, PATCH_MODEL, patch } from "./patch.mjs";
import { render } from "./render.mjs";
import {
	proxyImage,
	SOURCE_AGENT,
	SOURCE_DIRECT_MODEL,
	sourceProducts,
} from "./source.mjs";

// Catalog and Shop modules are owned by other agents: import defensively so a broken file cannot stop the server.
const CATALOG = await import("./catalog.mjs").catch((e) => {
	console.log(`catalog.mjs not loaded: ${e.message}`);
	return {};
});
const catalogRoutes = await import("./routes/catalog.mjs")
	.then((m) => m.catalogRoutes)
	.catch(() => null);
const shopRoutes = await import("./routes/shop.mjs")
	.then((m) => m.shopRoutes)
	.catch((e) => {
		console.log(`shop.mjs not loaded: ${e.message}`);
		return null;
	});

const pickMode = (v) => (["direct", "agent", "race"].includes(v) ? v : "race");

export const app = new Hono();

// One log line per request: time, method, path, status, ms, and the note the route left.
// SSE routes print theirs when the stream ends (see sse() in http.mjs).
app.use(async (c, next) => {
	const t0 = Date.now();
	let extra = "";
	c.set("note", (s) => {
		extra = s;
	});
	c.set("logLine", () =>
		console.log(
			`${new Date().toISOString().slice(11, 19)} ${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - t0}ms ${extra}`,
		),
	);
	await next();
	if (c.error)
		extra = `ERROR ${scrub(c.error.message || c.error).slice(0, 300)}`;
	if (c.req.method !== "OPTIONS" && !c.get("streaming")) c.get("logLine")();
});
app.use(
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["*"],
	}),
);
app.use(
	bodyLimit({
		maxSize: 25 * 1024 * 1024,
		onError: (c) => c.json({ error: "body too large" }, 413),
	}),
);

if (catalogRoutes) app.route("/api", catalogRoutes);
if (shopRoutes) app.route("/api", shopRoutes);

app.get("/api/health", (c) =>
	c.json({
		ok: true,
		gemini: geminiStats,
		models: {
			patch: PATCH_MODEL,
			designer: DESIGNER_MODEL,
			asset: assetConfig,
			image: IMAGE_MODEL,
			live: LIVE_MODEL,
			decision: DECISION_MODEL,
			source: { agent: SOURCE_AGENT, direct: SOURCE_DIRECT_MODEL },
		},
		catalog: CATALOG.catalogStats?.() || null,
	}),
);

app.post("/api/patch", async (c) => {
	const body = await readJson(c);
	const see = c.req.query("see");
	const out = await patch(body, {
		designer: c.req.query("designer") ?? null,
		see: see === undefined ? undefined : see === "1",
	});
	note(
		c,
		`"${String(body.utterance).slice(0, 60)}" -> ${out.ops.length} ops, ${out.jobs.length} jobs, ${out.model} ${out.ms}ms${out._dropped.length ? `, dropped: ${out._dropped.join("; ")}` : ""}`,
	);
	const { _dropped, ...resp } = out;
	if (_dropped.length) resp.dropped = _dropped;
	return c.json(resp);
});

app.post("/api/asset", async (c) => {
	const body = await readJson(c);
	if (!body.description && !body.name && !body.catalogId)
		return c.json({ error: "description required" }, 400);
	const mode = pickMode(c.req.query("via"));
	const agentModelQ = c.req.query("agentModel") || "";
	const agentModel = /^gemini-[\w.-]+$/.test(agentModelQ)
		? agentModelQ
		: undefined;
	return sse(c, async ({ send, signal }) => {
		// Catalog product: its pre-built model at once, no model call.
		const catEv = body.catalogId
			? CATALOG.catalogAssetEvent?.(body.catalogId)
			: null;
		if (catEv) {
			send(catEv);
			note(
				c,
				`${body.objectId || ""} catalog ${body.catalogId} -> done via catalog (${catEv.code.length} chars)`,
			);
			return;
		}
		let last = null;
		try {
			last = await buildAsset(body, {
				send: (ev) => {
					last = ev;
					send(ev);
				},
				mode,
				signal,
				agentModel,
			});
		} catch (e) {
			send({ type: "error", message: scrub(e.message || e) });
			last = { type: "error" };
		}
		note(
			c,
			`${body.objectId || ""} "${String(body.name || "").slice(0, 40)}" mode=${mode} -> ${last ? (last.type === "done" ? `done via ${last.via} (${last.ms}ms, ${last.code.length} chars)` : `${last.type}${last.message ? `: ${last.message.slice(0, 200)}` : ""}`) : "aborted by client"}`,
		);
	});
});

app.post("/api/source", async (c) => {
	const body = await readJson(c);
	if (!body.description && !body.name)
		return c.json({ error: "description required" }, 400);
	const mode = pickMode(c.req.query("via"));
	return sse(c, async ({ send, signal }) => {
		let last = null;
		try {
			last = await sourceProducts(body, { send, mode, signal });
		} catch (e) {
			send({ type: "error", message: scrub(e.message || e) });
			last = { type: "error", message: String(e.message) };
		}
		note(
			c,
			`${body.objectId || ""} "${String(body.name || "").slice(0, 40)}" mode=${mode} -> ${last ? (last.type === "done" ? `done via ${last.model} (${last.ms}ms, ${last.products.length} products)` : `${last.type}: ${String(last.message).slice(0, 200)}`) : "aborted by client"}`,
		);
	});
});

app.get("/api/img", async (c) => {
	const { type, body } = await proxyImage(c.req.query("u") ?? null);
	note(c, `${type} ${Math.round(body.length / 1024)}KB`);
	return c.body(body, 200, {
		"Content-Type": type,
		"Content-Length": String(body.length),
		"Cache-Control": "public, max-age=86400",
		"X-Content-Type-Options": "nosniff",
	});
});

app.post("/api/decal", async (c) => {
	const body = await readJson(c);
	const out = await decal(body);
	note(
		c,
		`${body.decalId || ""} ${out.aspectRatio} ${Math.round(out.dataUrl.length / 1024)}KB`,
	);
	return c.json(out);
});

app.get("/api/token", async (c) => c.json(await token()));

app.post("/api/verify", async (c) => {
	const body = await readJson(c);
	const out = await verify(body);
	note(
		c,
		Object.entries(out.results)
			.map(([k, v]) => `${k}=${v.yes.toFixed(2)}`)
			.join(" "),
	);
	return c.json(out);
});

app.post("/api/render", async (c) => {
	const body = await readJson(c);
	const out = await render(body);
	note(
		c,
		`${body.style ? `"${String(body.style).slice(0, 40)}" ` : ""}${Math.round(out.dataUrl.length / 1024)}KB model ${out.ms}ms`,
	);
	return c.json(out);
});

app.notFound((c) =>
	c.json({ error: `no route ${c.req.method} ${c.req.path}` }, 404),
);

app.onError((e, c) => {
	const status = e.status >= 400 && e.status < 600 ? e.status : 500;
	return c.json({ error: scrub(e.message || e) }, status);
});
