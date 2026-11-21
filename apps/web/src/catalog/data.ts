// Catalog listings joined with their product photo and build(THREE) model source (from @gemini-hack/catalog).
import catalog from "@gemini-hack/catalog/catalog.json";

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
const byFile = (m: Record<string, string>) =>
	Object.fromEntries(
		Object.entries(m).map(([k, v]) => [k.split("/").slice(-2).join("/"), v]),
	);
const CODE = byFile(
	import.meta.glob("@catalog/*/*.build.js", {
		query: "?raw",
		import: "default",
		eager: true,
	}) as Record<string, string>,
);
const IMAGES = byFile(
	import.meta.glob("@catalog/*/*.{png,jpg,jpeg,webp}", {
		query: "?url",
		import: "default",
		eager: true,
	}) as Record<string, string>,
);

export const modelRel = (e: Entry) =>
	e.modelFile ?? e.imageFile.replace(/\.(png|jpe?g|webp)$/i, ".build.js");

export const entries = (catalog as Entry[]).map((e, i) => ({
	...e,
	index: i,
	code: CODE[modelRel(e)] as string | undefined,
	img: IMAGES[e.imageFile],
}));
export type Item = (typeof entries)[number];
export const kinds = [...new Set(entries.map((e) => e.kind))];

export const fmtSize = (s: { x: number; y: number; z: number }) =>
	`${s.x.toFixed(2)} × ${s.y.toFixed(2)} × ${s.z.toFixed(2)} m`;
export const fmtPrice = (e: Item) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: e.currency || "USD",
	}).format(e.price);
