// OPTIONS panel: numbered product cards for one object (types.ts Options / OptionsResponse / ChooseRequest).
// Sources, merged in a fixed pattern so pages are stable: Shop MCP products WITH the merchant's GLB (buyable, real 3D),
// the pre-built catalog (instant, "similar", not buyable), then Shop products with only a photo (model generated
// from the photo). Pattern per page of 3: glb, glb, catalog; when a list runs out the others fill in.
// No Gemini calls here; Shop MCP and catalog.mjs are imported dynamically so a half-written file cannot break startup.
const SHOP = await import("./shop.mjs").catch(() => ({}));
const CATALOG = await import("./catalog.mjs").catch(() => ({}));

export const PAGE_SIZE = 3;
const KEYS = [
	"title",
	"price",
	"store",
	"url",
	"image_url",
	"catalogId",
	"variant_id",
	"shop",
	"model_glb",
	"model_usdz",
	"similar",
	"model",
];
export const cleanProduct = (p) =>
	Object.fromEntries(
		KEYS.filter(
			(k) => p?.[k] !== undefined && p[k] !== null && p[k] !== "",
		).map((k) => [k, p[k]]),
	);
export const sameProduct = (a, b) =>
	!!(
		a &&
		b &&
		((a.variant_id && a.variant_id === b.variant_id) ||
			(a.url && a.url === b.url) ||
			(a.catalogId && a.catalogId === b.catalogId))
	);
const tag = (p) => ({
	...p,
	model: p.model_glb ? "glb" : p.catalogId ? "catalog" : "photo",
});

function catalogMatches(query, maxPrice, n) {
	const picks = CATALOG.pickCatalog?.(query, { maxPrice, limit: n }) || [];
	return picks
		.map((c) => CATALOG.catalogObject?.(c.catalogId)?.product)
		.filter(Boolean)
		.map((p) => ({ ...p, similar: true }));
}

/**
 * Ranked option list long enough for `page`. Returns { products (whole list up to and including the page), more, ms, errors }.
 * budgetMs caps each Shop search (AbortSignal); a slow or failed search just contributes nothing.
 */
export async function productOptions(
	query,
	{ maxPrice, exclude, page = 0, pageSize = PAGE_SIZE, budgetMs = 1500 } = {},
) {
	const t0 = Date.now();
	const need = (page + 1) * pageSize + 1;
	const errors = [];
	const price = maxPrice ? { price: { max: Math.round(maxPrice * 100) } } : {};
	const search = (opts) =>
		SHOP.shopSearch
			? SHOP.shopSearch(query, {
					...opts,
					...price,
					signal: AbortSignal.timeout(budgetMs),
				})
					.then((o) => o.products)
					.catch((e) => {
						errors.push(String(e.message).slice(0, 80));
						return [];
					})
			: Promise.resolve([]);
	const [glbRaw, photoRaw] = await Promise.all([
		search({ model3d: true, limit: Math.min(50, need) }),
		search({ limit: Math.min(50, Math.ceil(need / 2) + 2) }),
	]);
	const seen = [];
	const keep = (p) => {
		if (
			!p ||
			p.available === false ||
			!p.url ||
			sameProduct(p, exclude) ||
			seen.some((s) => sameProduct(s, p))
		)
			return false;
		seen.push(p);
		return true;
	};
	const glb = glbRaw.filter((p) => p.model_glb).filter(keep);
	const cat = catalogMatches(query, maxPrice, Math.max(3, page + 2)).filter(
		keep,
	);
	const photo = photoRaw.filter((p) => !p.model_glb).filter(keep);
	const out = [];
	while (out.length < need && (glb.length || cat.length)) {
		for (const want of [glb, glb, cat]) {
			const src = want.length ? want : glb.length ? glb : cat;
			if (src.length && out.length < need) out.push(src.shift());
		}
	}
	while (out.length < need && photo.length) out.push(photo.shift());
	const products = out.map((p) => cleanProduct(tag(p)));
	return {
		products: products.slice(0, (page + 1) * pageSize),
		more:
			products.length > (page + 1) * pageSize ||
			glb.length + cat.length + photo.length > 0,
		ms: Date.now() - t0,
		errors,
	};
}

export async function optionsPage(
	query,
	{ page = 0, objectId = "", maxPrice, exclude } = {},
) {
	const r = await productOptions(query, { page, maxPrice, exclude });
	return {
		objectId,
		query,
		products: r.products.slice(page * PAGE_SIZE),
		page,
		pageSize: PAGE_SIZE,
		more: r.more,
		ms: r.ms,
	};
}

const shortTitle = (t) =>
	String(t || "item")
		.split(/\s[-|–]\s|,|\(/)[0]
		.split(/\s+/)
		.slice(0, 5)
		.join(" ")
		.trim();

/**
 * Put a product on an existing object: one update op + one asset job (glb | catalogId | image_url) + a short say.
 * size: kept (the client measures a GLB); a catalog product brings its catalog size. room is used to keep the object
 * against the same wall when the size changes (reanchor is passed in from patch.mjs to avoid an import cycle).
 */
export function chooseProduct(
	scene,
	objectId,
	product,
	{ reanchor, fit } = {},
) {
	const t0 = Date.now();
	const cur = (scene?.objects || []).find((o) => o.id === objectId);
	if (!cur) {
		const e = new Error(`no object ${objectId}`);
		e.status = 400;
		throw e;
	}
	const p = cleanProduct(tag(product || {}));
	if (!p.title) {
		const e = new Error("product.title required");
		e.status = 400;
		throw e;
	}
	const cat = p.catalogId ? CATALOG.catalogObject?.(p.catalogId) : null;
	const name = shortTitle(p.title);
	const changes = {
		name,
		shape: "custom",
		status: "building",
		product: p,
		glb: p.model_glb || null,
		description: cat
			? cat.description
			: `${p.title} from ${p.store}. ${cur.description || ""}`
					.trim()
					.slice(0, 600),
	};
	if (cat) {
		changes.size = { ...cat.size };
		if (cat.color) changes.color = cat.color;
		if (reanchor) changes.position = reanchor(cur, cat.size);
		if (fit) fit(changes);
	}
	const size = changes.size || cur.size;
	const job = {
		kind: "asset",
		objectId,
		name,
		description: changes.description,
		size,
	};
	if (p.model_glb) job.glb = p.model_glb;
	else if (p.catalogId) job.catalogId = p.catalogId;
	else if (p.image_url) job.image_url = p.image_url;
	return {
		ops: [{ op: "update", id: objectId, changes }],
		jobs: [job],
		say: `Swapped in the ${name}.`,
		ms: Date.now() - t0,
	};
}
