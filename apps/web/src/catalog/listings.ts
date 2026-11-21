// Catalog listings as shop products: name, price, vendor and photo, without the model code.
// Used by the studio's "Shop the look" panel to offer same-kind alternatives for a placed catalog item.
import catalog from "@gemini-hack/catalog/catalog.json";
import type { Product } from "../types";

type Entry = {
	kind: string;
	name: string;
	productType: string;
	vendor: string;
	price: number;
	currency: string;
	imageFile: string;
	modelFile?: string;
};

// Glob keys are rewritten by Vite; key them by "<kind>/<file>", the form catalog.json uses.
const IMAGES = Object.fromEntries(
	Object.entries(
		import.meta.glob("@catalog/*/*.{png,jpg,jpeg,webp}", {
			query: "?url",
			import: "default",
			eager: true,
		}) as Record<string, string>,
	).map(([k, v]) => [k.split("/").slice(-2).join("/"), v]),
);

/** Same id the server uses: the model file without ".build.js" (e.g. "sofa/03-junction"). */
const idOf = (e: Entry) =>
	(e.modelFile ?? e.imageFile).replace(/\.(build\.js|png|jpe?g|webp)$/i, "");

const money = (e: Entry) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: e.currency || "USD",
	}).format(e.price);

function toProduct(e: Entry): Product {
	const img = IMAGES[e.imageFile];
	return {
		title: e.name,
		price: money(e),
		store: e.vendor,
		url: "",
		image_url:
			img && typeof location !== "undefined"
				? new URL(img, location.href).href
				: "",
		catalogId: idOf(e),
	};
}

const ALL = (catalog as Entry[]).map((e) => ({
	kind: e.kind,
	p: toProduct(e),
}));

export const kindOf = (catalogId: string) => catalogId.split("/")[0] ?? "";

/** The placed item first, then up to `n - 1` other items of the same kind, nearest in price. */
export function alternativesFor(catalogId: string, n = 4): Product[] {
	const kind = kindOf(catalogId);
	const same = ALL.filter((x) => x.kind === kind).map((x) => x.p);
	const cur = same.find((p) => p.catalogId === catalogId);
	if (!cur) return [];
	const price = (p: Product) => Number(p.price.replace(/[^\d.]/g, "")) || 0;
	const others = same
		.filter((p) => p !== cur)
		.sort(
			(a, b) =>
				Math.abs(price(a) - price(cur)) - Math.abs(price(b) - price(cur)),
		)
		.slice(0, n - 1);
	return [cur, ...others];
}
