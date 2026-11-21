// Generated-model library: build(THREE) models the agent has made, kept by object name.
// A request for a name that is in the library is answered at once from disk instead of running the agent again.
// Files live next to the shop catalog (packages/catalog/generated/<slug>.build.js) so they are committed and shared.
import fs from "node:fs";
import path from "node:path";
import { CATALOG_DIR } from "@gemini-hack/catalog";
import { validateCode } from "./asset.mjs";

export const LIBRARY_DIR = path.join(CATALOG_DIR, "..", "generated");
const MAX_CODE_CHARS = 60_000;

/** "L-shaped desk" and "l shaped desk" are the same entry. */
export function librarySlug(name) {
	return String(name || "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
}

const fileFor = (slug) => path.join(LIBRARY_DIR, `${slug}.build.js`);

/** AssetEvent "done" for a name that is in the library, or null. */
export function libraryAssetEvent(name) {
	const slug = librarySlug(name);
	if (!slug) return null;
	const t0 = Date.now();
	let code;
	try {
		code = fs.readFileSync(fileFor(slug), "utf8");
	} catch {
		return null;
	}
	return {
		type: "done",
		code,
		ms: Date.now() - t0,
		via: "catalog",
		model: `library:${slug}`,
	};
}

/** Saves a freshly generated model under its name. An entry that exists is kept (first good model wins). */
export function librarySave(name, code) {
	const slug = librarySlug(name);
	if (!slug || typeof code !== "string" || code.length > MAX_CODE_CHARS)
		return { ok: false, error: "bad name or code" };
	const file = fileFor(slug);
	if (fs.existsSync(file)) return { ok: false, error: "already in library" };
	const v = validateCode(code);
	if (!v.ok) return { ok: false, error: v.error };
	fs.mkdirSync(LIBRARY_DIR, { recursive: true });
	fs.writeFileSync(file, code);
	return { ok: true, slug };
}
