// Shop catalog (packages/catalog): 100 real listings, each with a pre-built build(THREE) model.
// Measures every model once with the real three.js (same vm approach as asset.mjs validateCode), excludes broken ones,
// and gives the orchestrator a compact list to pick from. No model calls.
//   loadCatalog()            -> usable CatalogItem-like records (cached)
//   validateCatalog()        -> problems for every model that is not usable
//   catalogCode(id)          -> build.js source or null
//   catalogItem(id)          -> one usable record or null
//   catalogObject(id)        -> { name, description, color, size, product } for buildOps
//   catalogAssetEvent(id)    -> AssetEvent "done" (via "catalog") or null, for the /api/asset fast path
//   catalogPromptBlock()     -> one line per usable item for the orchestrator prompt
//   pickCatalog(query, opts) -> best matches by simple scoring
//   handleCatalog(req,res,url) -> serves GET /api/catalog, returns false for other routes
// Self-contained on purpose: does not import lib.mjs (API key) or asset.mjs (prompt files, agent code).

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { fitScale } from "@gemini-hack/placement";
import { findSupports } from "@gemini-hack/placement/supports";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

import { CATALOG_DIR, CATALOG_JSON } from "@gemini-hack/catalog";

export { CATALOG_DIR };

const SIZES_JSON = path.join(SERVER_DIR, "catalog-sizes.json");
const MEASURE_VERSION = "m7:"; // bump when measure() output changes, so catalog-sizes.json is rebuilt

let THREE = null;
try {
	THREE = await import("three");
} catch {
	console.warn(
		"[catalog] three not importable; catalog models cannot be measured",
	);
}

// ---------- per-kind sanity ranges (meters): [min, max] for width x, height y, depth z ----------
// Generous on purpose: catches models built at the wrong scale, not style differences.
const KIND_RANGE = {
	sofa: { x: [1.0, 3.6], y: [0.55, 1.2], z: [0.6, 1.9] },
	armchair: { x: [0.45, 1.3], y: [0.55, 1.3], z: [0.5, 1.4] },
	"dining-chair": { x: [0.35, 0.75], y: [0.7, 1.15], z: [0.38, 0.75] },
	"office-chair": { x: [0.45, 0.85], y: [0.75, 1.45], z: [0.45, 0.85] },
	stool: { x: [0.25, 0.75], y: [0.3, 1.05], z: [0.25, 0.75] },
	bench: { x: [0.4, 2.4], y: [0.14, 1.0], z: [0.2, 0.75] }, // incl. low meditation / folding benches
	ottoman: { x: [0.3, 1.4], y: [0.25, 0.6], z: [0.3, 1.4] },
	"dining-table": { x: [0.7, 3.2], y: [0.65, 0.82], z: [0.6, 1.3] },
	"coffee-table": { x: [0.4, 1.8], y: [0.2, 0.6], z: [0.35, 1.2] },
	"side-table": { x: [0.25, 1.1], y: [0.35, 0.8], z: [0.25, 0.8] }, // nesting sets stand side by side
	"console-table": { x: [0.6, 2.4], y: [0.65, 1.0], z: [0.22, 0.6] },
	desk: { x: [0.6, 2.2], y: [0.3, 1.9], z: [0.25, 0.95] }, // wall-mounted fold-down desks are short
	bed: { x: [0.8, 2.4], y: [0.25, 2.4], z: [1.0, 2.5] },
	nightstand: { x: [0.25, 0.8], y: [0.15, 0.85], z: [0.15, 0.6] },
	dresser: { x: [0.5, 2.2], y: [0.6, 1.6], z: [0.3, 0.7] },
	wardrobe: { x: [0.4, 3.5], y: [0.9, 2.6], z: [0.3, 0.9] },
	bookcase: { x: [0.3, 3.5], y: [0.3, 2.8], z: [0.2, 0.6] }, // single cube shelves
	cabinet: { x: [0.5, 3.0], y: [0.4, 2.4], z: [0.3, 0.7] },
	"floor-lamp": { x: [0.2, 2.0], y: [1.1, 2.3], z: [0.2, 1.2] },
	rug: { x: [0.4, 4.0], y: [0.003, 0.06], z: [0.4, 4.0] },
	// room items (non-furniture)
	"table-lamp": { x: [0.1, 0.7], y: [0.2, 0.9], z: [0.1, 0.7] },
	"potted-plant": { x: [0.08, 1.4], y: [0.1, 2.4], z: [0.08, 1.4] },
	vase: { x: [0.05, 0.5], y: [0.08, 0.8], z: [0.05, 0.5] },
	"computer-monitor": { x: [0.3, 1.3], y: [0.25, 0.8], z: [0.05, 0.4] },
	speaker: { x: [0.06, 1.2], y: [0.06, 1.9], z: [0.05, 0.6] },
	"storage-basket": { x: [0.15, 0.8], y: [0.08, 0.8], z: [0.12, 0.8] },
	book: { x: [0.1, 0.45], y: [0.01, 0.12], z: [0.12, 0.45] },
	"throw-pillow": { x: [0.25, 0.9], y: [0.1, 0.6], z: [0.08, 0.6] },
	laptop: { x: [0.25, 0.45], y: [0.15, 0.35], z: [0.18, 0.4] },
	"wall-clock": { x: [0.15, 0.9], y: [0.15, 1.2], z: [0.02, 0.15] },
	"wall-art": { x: [0.15, 2.0], y: [0.15, 2.0], z: [0.005, 0.2] },
	mirror: { x: [0.15, 1.2], y: [0.2, 2.1], z: [0.01, 0.6] },
	mug: { x: [0.05, 0.45], y: [0.04, 0.2], z: [0.05, 0.2] }, // incl. nesting sets in a row
	tray: { x: [0.12, 0.8], y: [0.01, 0.2], z: [0.08, 0.6] },
	candle: { x: [0.02, 0.4], y: [0.04, 0.45], z: [0.02, 0.4] },
	"pendant-light": { x: [0.1, 1.5], y: [0.06, 1.8], z: [0.1, 1.5] }, // flush mounts are shallow
	curtain: { x: [0.6, 3.5], y: [0.5, 3.0], z: [0.02, 0.3] },
	"coffee-maker": { x: [0.08, 0.5], y: [0.1, 0.5], z: [0.08, 0.5] },
	"pet-bed": { x: [0.3, 2.0], y: [0.08, 0.8], z: [0.3, 1.2] },
	keyboard: { x: [0.08, 0.6], y: [0.015, 0.1], z: [0.06, 0.4] }, // a cable at the back counts
	"throw-blanket": { x: [0.25, 2.0], y: [0.005, 1.6], z: [0.02, 2.0] }, // folded, laid flat or hung
	turntable: { x: [0.3, 0.6], y: [0.06, 0.25], z: [0.25, 0.5] },
	television: { x: [0.6, 2.5], y: [0.35, 1.6], z: [0.03, 0.6] },
	"string-lights": { x: [0.3, 4.0], y: [0.05, 2.0], z: [0.01, 0.3] },
	wreath: { x: [0.2, 0.9], y: [0.2, 1.0], z: [0.03, 0.25] },
	"christmas-tree": { x: [0.15, 1.6], y: [0.25, 2.5], z: [0.15, 1.6] },
	pumpkin: { x: [0.08, 0.6], y: [0.06, 0.6], z: [0.08, 0.6] },
};

const THIN = new Set([
	"rug",
	"book",
	"wall-art",
	"tray",
	"keyboard",
	"throw-blanket",
	"mirror",
	"curtain",
	"wall-clock",
	"string-lights",
	"laptop",
	"wreath",
	"television",
	"computer-monitor",
]);
const BACKED = new Set([
	"sofa",
	"armchair",
	"dining-chair",
	"office-chair",
	"bed",
]);
const LONG_X = new Set([
	"sofa",
	"bench",
	"coffee-table",
	"dining-table",
	"console-table",
	"desk",
	"dresser",
	"cabinet",
	"bookcase",
	"wardrobe",
]);

// Things the client sandbox (web/src/scene/model.ts evaluateModelCode: new Function("THREE", src)) cannot or must not use.
const FORBIDDEN = [
	[
		/\b(document|window|navigator|localStorage|sessionStorage|location)\b/,
		"DOM/browser global",
	],
	[
		/\b(fetch|XMLHttpRequest|WebSocket|Worker|importScripts)\b/,
		"network/worker",
	],
	[
		/\bimport\s*\(|^\s*import\s|^\s*export\s|\brequire\s*\(/m,
		"import/export/require",
	],
	[/\beval\s*\(|\bnew\s+Function\b/, "eval"],
	[/\b(setTimeout|setInterval|requestAnimationFrame)\b/, "timers"],
	[/\bprocess\.|\bglobalThis\b/, "globals"],
	[
		/\w*Loader\b|CanvasTexture|DataTexture|\bTexture\s*\(/,
		"texture/asset loading",
	],
];

// ---------- helpers ----------
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000; // sizes: millimetres, so thin things (books, art, trays) keep their depth
const fmtPrice = (n, cur = "USD") =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: cur,
		maximumFractionDigits: n % 1 ? 2 : 0,
	}).format(n);
const idOf = (e) => String(e.modelFile || "").replace(/\.build\.js$/, "");
const sha = (s) =>
	crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);

/** Plain colour name for a hex colour (no model calls). */
export function colorName(hex) {
	const n =
		typeof hex === "number"
			? hex
			: Number.parseInt(String(hex).replace("#", ""), 16);
	const r = ((n >> 16) & 255) / 255;
	const g = ((n >> 8) & 255) / 255;
	const b = (n & 255) / 255;
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	const l = (mx + mn) / 2;
	const d = mx - mn;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
	let h = 0;
	if (d)
		h =
			mx === r
				? 60 * (((g - b) / d) % 6)
				: mx === g
					? 60 * ((b - r) / d + 2)
					: 60 * ((r - g) / d + 4);
	if (h < 0) h += 360;
	if (l < 0.1) return "black";
	if (s < 0.1 || (l < 0.18 && s < 0.25))
		return l > 0.86
			? "white"
			: l > 0.66
				? "light grey"
				: l > 0.36
					? "grey"
					: l > 0.18
						? "dark grey"
						: "charcoal";
	if (h >= 15 && h < 55 && (s < 0.45 || l < 0.4)) {
		if (l > 0.82) return "cream";
		if (l > 0.64) return "beige";
		if (l > 0.45) return s < 0.25 ? "taupe" : "tan";
		if (l > 0.25) return "brown";
		return "dark brown";
	}
	if (h < 12 || h >= 345)
		return l < 0.3 ? "burgundy" : l > 0.7 ? "pink" : "red";
	if (h < 42) return l < 0.42 ? "rust" : l > 0.72 ? "peach" : "orange";
	if (h < 66) return l < 0.45 ? "olive" : s < 0.5 ? "mustard" : "yellow";
	if (h < 160)
		return s < 0.3
			? "sage"
			: l < 0.3
				? "dark green"
				: h < 90
					? "olive"
					: "green";
	if (h < 200) return "teal";
	if (h < 250) return l < 0.3 ? "navy" : s < 0.3 ? "slate blue" : "blue";
	if (h < 290) return "purple";
	return l > 0.65 ? "pink" : "plum";
}

// Material words from the code's variable names (woodMat, oakMat, sageWoolMat, matTufted...).
const MAT_WORDS = [
	"walnut",
	"oak",
	"birch",
	"teak",
	"pine",
	"ash",
	"plywood",
	"wood",
	"rattan",
	"cane",
	"wicker",
	"leather",
	"velvet",
	"boucle",
	"linen",
	"wool",
	"felt",
	"fabric",
	"brass",
	"chrome",
	"steel",
	"iron",
	"pewter",
	"metal",
	"marble",
	"stone",
	"glass",
	"plastic",
	"jute",
	"cotton",
	"lacquer",
];
const MAT_ALIASES = {
	upholstery: "fabric",
	cushion: "fabric",
	tufted: "fabric",
	textile: "fabric",
	seat: null,
	ply: "plywood",
};
function matWordFromVar(name) {
	const parts = String(name)
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.split(/[^a-z]+/);
	for (const p of parts) {
		if (MAT_WORDS.includes(p)) return p;
		if (MAT_ALIASES[p]) return MAT_ALIASES[p];
	}
	return null;
}
// hex -> material word, from `const fooMat = new THREE.MeshStandardMaterial({ color: 0x...`
function varColorMap(code) {
	const out = new Map();
	const re =
		/(?:const|let|var)\s+(\w+)\s*=\s*new\s+THREE\.Mesh\w*Material\(\s*\{[^}]*?\bcolor\s*:\s*(?:0x([0-9a-fA-F]{6})|['"]#([0-9a-fA-F]{6})['"])/g;
	for (const m of code.matchAll(re)) {
		const w = matWordFromVar(m[1]);
		if (w) out.set((m[2] || m[3]).toLowerCase(), w);
	}
	return out;
}

const STYLE_WORDS = [
	"modular",
	"upholstered",
	"sculpted",
	"tufted",
	"rocking",
	"folding",
	"stackable",
	"nesting",
	"adjustable",
	"compact",
	"storage",
	"drop-leaf",
	"pedestal",
	"tripod",
	"arc",
	"canopy",
	"bunk",
	"braided",
	"woven",
	"reclaimed",
	"expandable",
	"height-adjustable",
	"children's",
	"built-in",
	"round",
	"trestle",
	"saddle",
	"sleeper",
	"glazed",
	"embroidered",
	"counterbalance",
	"shelf",
];

// ---------- measuring ----------
function staticProblems(code) {
	const bad = [];
	if (!/function\s+build\s*\(/.test(code)) bad.push("no `function build(`");
	const src = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, ""); // comments may say "window" etc.
	for (const [re, what] of FORBIDDEN)
		if (re.test(src))
			bad.push(`uses ${what} (${(src.match(re) || [""])[0].trim()})`);
	return bad;
}

/** Runs one model with real three.js (as asset.mjs validateCode does) and measures it. Never throws. */
function measure(code, kind) {
	const problems = staticProblems(code);
	const warnings = [];
	if (/Math\.random/.test(code))
		warnings.push("uses Math.random (not deterministic)");
	if (/\bconsole\./.test(code)) warnings.push("uses console");
	if (!THREE)
		return {
			ok: false,
			problems: [...problems, "three not available on server"],
		};
	let g;
	let buildMs = 0;
	try {
		// Fresh shallow copy like the client does, so code that assigns onto THREE behaves the same.
		const ctx = vm.createContext({ THREE: Object.assign({}, THREE) });
		// Catalog files are trusted and pre-built, so the timeout is generous (asset.mjs uses 3 s for fresh model output):
		// a busy laptop takes several seconds on the heaviest models. Slow builds are reported as warnings.
		const t = Date.now();
		new vm.Script(
			`"use strict";\n${code}\n;globalThis.__out = build(THREE);`,
		).runInContext(ctx, { timeout: 15000 });
		buildMs = Date.now() - t;
		g = ctx.__out;
	} catch (e) {
		return {
			ok: false,
			problems: [
				...problems,
				"build(THREE) threw: " + String(e?.message || e).slice(0, 200),
			],
			warnings,
		};
	}
	if (!g || !g.isObject3D)
		return {
			ok: false,
			problems: [...problems, "build(THREE) did not return an Object3D"],
			warnings,
		};
	g.updateMatrixWorld(true);
	let meshes = 0;
	let verts = 0;
	let lights = 0;
	const weights = new Map(); // hex -> { w, metal, glass }
	const box = new THREE.Box3();
	const mb = new THREE.Box3();
	const ms = new THREE.Vector3();
	const parts = [];
	g.traverse((o) => {
		if (o.isLight) lights++;
		if (!o.isMesh || !o.geometry?.attributes?.position) return;
		meshes++;
		verts += o.geometry.attributes.position.count;
		mb.setFromObject(o);
		box.union(mb);
		mb.getSize(ms);
		parts.push({
			top: mb.max.y,
			cz: (mb.min.z + mb.max.z) / 2,
			a: ms.x * ms.y + ms.y * ms.z + ms.x * ms.z,
		});
		const area = 2 * (ms.x * ms.y + ms.y * ms.z + ms.x * ms.z);
		for (const m of [].concat(o.material || [])) {
			if (!m?.color) continue;
			const hex = m.color.getHexString();
			const e = weights.get(hex) || {
				w: 0,
				metal: (m.metalness ?? 0) > 0.5,
				glass: m.transparent && (m.opacity ?? 1) < 0.6,
			};
			e.w += area;
			weights.set(hex, e);
		}
	});
	if (!meshes) problems.push("model has no meshes");
	if (box.isEmpty())
		return {
			ok: false,
			problems: [...problems, "bounding box is empty"],
			warnings,
		};
	const sz = box.getSize(new THREE.Vector3());
	const c = box.getCenter(new THREE.Vector3());
	if (![sz.x, sz.y, sz.z].every(Number.isFinite))
		return {
			ok: false,
			problems: [...problems, "bounding box is NaN"],
			warnings,
		};
	const bbox = { x: r3(sz.x), y: r3(sz.y), z: r3(sz.z) };
	// Flat or thin kinds are judged by their largest side: a book is 2 cm thick, wall art 1 cm deep.
	const minDim = THIN.has(kind)
		? Math.max(sz.x, sz.y, sz.z)
		: Math.min(sz.x, sz.y, sz.z);
	if (minDim < 0.02)
		problems.push(`absurdly small (${bbox.x}x${bbox.y}x${bbox.z} m)`);
	if (Math.max(sz.x, sz.y, sz.z) > 4)
		problems.push(`absurdly large (${bbox.x}x${bbox.y}x${bbox.z} m)`);
	const range = KIND_RANGE[kind];
	if (range)
		for (const ax of ["x", "y", "z"]) {
			const [lo, hi] = range[ax];
			if (sz[ax] < lo * 0.7 || sz[ax] > hi * 1.4)
				problems.push(
					`${ax} = ${r2(sz[ax])} m is far outside ${lo}-${hi} m for a ${kind}`,
				);
			else if (sz[ax] < lo || sz[ax] > hi)
				warnings.push(
					`${ax} = ${r2(sz[ax])} m is outside the usual ${lo}-${hi} m for a ${kind}`,
				);
		}
	if (Math.abs(box.min.y) > 0.03)
		warnings.push(`base at y = ${r2(box.min.y)} (client re-centers it)`);
	if (Math.abs(c.x) > 0.05 || Math.abs(c.z) > 0.05)
		warnings.push(
			`not centered (x ${r2(c.x)}, z ${r2(c.z)}; client re-centers it)`,
		);
	// Orientation: for things with a back (backrest, headboard), the tall parts must sit toward -Z (front = +Z).
	let backZ = null;
	if (BACKED.has(kind)) {
		const H = box.max.y;
		const hi = parts.filter((p) => p.top > box.min.y + 0.85 * (H - box.min.y));
		const w = hi.reduce((s, p) => s + p.a, 0);
		if (w > 0)
			backZ =
				(hi.reduce((s, p) => s + p.a * p.cz, 0) / w - c.z) /
				Math.max(sz.z, 1e-6); // -0.5 = at the back
		if (backZ != null && backZ > 0.08)
			problems.push(
				`faces -Z: its back/tall parts are toward +Z (backZ ${backZ.toFixed(2)})`,
			);
	}
	if (LONG_X.has(kind) && sz.z > sz.x * 1.25)
		warnings.push(
			`long side runs along z (${r2(sz.x)} x ${r2(sz.z)}); it stands sideways unless rotated 90 deg`,
		);
	if (meshes > 250) warnings.push(`${meshes} meshes`);
	if (buildMs > 400)
		warnings.push(
			`slow build: ${buildMs} ms in Node just now (the browser runs it on the main thread)`,
		);
	if (verts > 400000) warnings.push(`${verts} vertices`);
	if (lights) warnings.push(`${lights} lights (client strips them)`);
	const colors = [...weights.entries()]
		.sort((a, b) => b[1].w - a[1].w)
		.map(([hex, e]) => ({ hex, share: e.w, metal: e.metal, glass: e.glass }));
	const tot = colors.reduce((s, x) => s + x.share, 0) || 1;
	colors.forEach((x) => {
		x.share = +(x.share / tot).toFixed(3);
	});
	// Support surfaces (seat, shelves, top), relative to the bottom-center of the bounding box like everything else.
	let supports = [];
	try {
		supports = findSupports(THREE, g).map((p) => ({
			...p,
			y: r3(p.y - box.min.y),
			x0: r3(p.x0 - c.x),
			x1: r3(p.x1 - c.x),
			z0: r3(p.z0 - c.z),
			z1: r3(p.z1 - c.z),
		}));
	} catch (e) {
		warnings.push(
			"support analysis failed: " + String(e?.message || e).slice(0, 80),
		);
	}
	return {
		ok: problems.length === 0,
		problems,
		warnings,
		bbox,
		meshes,
		verts,
		minY: r2(box.min.y),
		backZ: backZ == null ? null : +backZ.toFixed(2),
		buildMs,
		colors,
		supports,
	};
}

// Listing rule from catalog-dims.mjs: the default size variant is the target; the teammate regenerated models until
// they matched it within 5%. We use the listed value for an axis when the model is within 5%, else the measured one.
function applyListing(bbox, e) {
	const t = e.listing?.target;
	const size = { ...bbox };
	const notes = [];
	if (!t) return { size, notes };
	const near = (got, want) => Math.abs(got - want) / want <= 0.05;
	for (const ax of ["x", "y", "z"])
		if (t[ax] != null) {
			if (near(bbox[ax], t[ax])) size[ax] = r2(t[ax]);
			else notes.push(`${ax} ${bbox[ax]} vs listed ${t[ax]}`);
		}
	if (t.footprint) {
		const [a, b] = t.footprint;
		const short = bbox.x <= bbox.z ? "x" : "z";
		const long = short === "x" ? "z" : "x";
		if (near(bbox[short], a) && near(bbox[long], b)) {
			size[short] = r2(a);
			size[long] = r2(b);
		} else notes.push(`footprint ${bbox.x}x${bbox.z} vs listed ${a}x${b}`);
	}
	return { size, notes };
}

const WOODY = new Set([
	"walnut",
	"oak",
	"birch",
	"teak",
	"pine",
	"ash",
	"plywood",
	"wood",
]);
const SELF_COLORED = new Set(["brass", "chrome", "pewter", "steel", "glass"]);
function woodTone(hex) {
	const n = Number.parseInt(hex, 16);
	const r = (n >> 16) & 255;
	const g = (n >> 8) & 255;
	const b = n & 255;
	const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
	return l > 0.62 ? "pale" : l > 0.42 ? "light" : l > 0.25 ? "mid" : "dark";
}
function describeLook(m, e, code) {
	const vars = varColorMap(code);
	const words = [];
	const names = [];
	for (const c of m.colors || []) {
		if (words.length >= 2 || c.share < 0.12) break;
		const mat =
			vars.get(c.hex) || (c.glass ? "glass" : c.metal ? "metal" : null);
		let name = colorName(c.hex);
		// Natural wood reads better as a tone ("light oak") than as a hue ("orange oak"); painted wood keeps its colour.
		if (
			mat &&
			WOODY.has(mat) &&
			/^(cream|beige|taupe|tan|brown|dark brown|orange|peach|rust|mustard)$/.test(
				name,
			)
		)
			name = woodTone(c.hex);
		if (mat && SELF_COLORED.has(mat)) name = "";
		const text = [name, mat].filter(Boolean).join(" ");
		if (
			words.some(
				(w) =>
					w === text ||
					w.startsWith(name + " ") ||
					(!mat && w.split(" ")[0] === name),
			)
		)
			continue;
		words.push(text);
	}
	for (const c of (m.colors || []).slice(0, 3)) names.push(colorName(c.hex));
	const nm = `${e.name} ${e.productType}`.toLowerCase();
	const nameMat = MAT_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(nm));
	if (nameMat && !words.some((w) => w.includes(nameMat))) words.push(nameMat);
	const style = STYLE_WORDS.find(
		(w) =>
			nm.includes(w) &&
			!e.productType.toLowerCase().includes(w) &&
			!e.name.toLowerCase().includes(w),
	);
	if (style) words.push(style);
	return { look: words.join(", "), colorNames: names };
}

// ---------- loading ----------
let CACHE = null; // { all: [...records incl. broken], usable, byId, ms, from }

function readCatalogJson() {
	return JSON.parse(fs.readFileSync(CATALOG_JSON, "utf8"));
}

function build() {
	const t0 = Date.now();
	const raw = readCatalogJson();
	let stored = {};
	try {
		stored = JSON.parse(fs.readFileSync(SIZES_JSON, "utf8")).items || {};
	} catch {}
	let measured = 0;
	const all = raw.map((e) => {
		const catalogId = idOf(e);
		let code = null;
		try {
			code = fs.readFileSync(path.join(CATALOG_DIR, e.modelFile), "utf8");
		} catch {}
		const base = {
			catalogId,
			kind: e.kind,
			title: e.name,
			productType: e.productType,
			vendor: e.vendor,
			price: fmtPrice(e.price, e.currency),
			priceValue: e.price,
			currency: e.currency,
			store: e.store,
			// mock.shop is Shopify's demo store: nothing is buyable, so url stays ''. (The demo page does load at
			// https://<store>.hydrogen.mock.shop/products/<handle>; kept as demoUrl for reference only.)
			url: "",
			demoUrl:
				e.store && e.handle
					? `https://${e.store}.hydrogen.mock.shop/products/${e.handle}`
					: "",
			image_url: e.imageUrl || "",
			modelFile: e.modelFile,
			listing: e.listing || null,
		};
		if (!code)
			return {
				...base,
				ok: false,
				problems: ["model file missing"],
				warnings: [],
			};
		const hash = sha(MEASURE_VERSION + code);
		let m = stored[catalogId]?.hash === hash ? stored[catalogId].m : null;
		if (!m) {
			m = measure(code, e.kind);
			measured++;
		}
		const { size, notes } = m.bbox
			? applyListing(m.bbox, e)
			: { size: null, notes: [] };
		return {
			...base,
			hash,
			ok: m.ok,
			problems: m.problems || [],
			warnings: [...(m.warnings || []), ...notes.map((n) => "listing: " + n)],
			m,
			size,
			bbox: m.bbox,
			...(m.ok ? describeLook(m, e, code) : { look: "", colorNames: [] }),
			color: m.colors?.[0] ? "#" + m.colors[0].hex : "#888888",
		};
	});
	const ms = Date.now() - t0;
	// Measuring all 100 takes ~0.7 s on an idle laptop but several seconds under load, so measurements are kept on disk
	// keyed by a hash of (measure version + code): a changed model file is re-measured, the rest load in ~50 ms.
	if (measured) {
		try {
			fs.writeFileSync(
				SIZES_JSON,
				JSON.stringify({
					note: "measured by server/catalog.mjs; re-measured when a model file changes",
					items: Object.fromEntries(
						all
							.filter(
								(r) => r.m && !r.problems.some((p) => /timed out/.test(p)),
							)
							.map((r) => [r.catalogId, { hash: r.hash, m: r.m }]),
					),
				}),
			);
		} catch {}
	}
	const usable = all.filter((r) => r.ok);
	return {
		all,
		usable,
		byId: new Map(usable.map((r) => [r.catalogId, r])),
		ms,
		measured,
	};
}

function cache() {
	return (CACHE ||= build());
}
/** Forget the cache (tests, or after the catalog files change). */
export function reloadCatalog() {
	CACHE = null;
	return cache();
}
/** How long loading took and how many models were measured (vs. read from catalog-sizes.json). */
export function catalogStats() {
	const c = cache();
	return {
		ms: c.ms,
		measured: c.measured,
		total: c.all.length,
		usable: c.usable.length,
	};
}

// `store` is the merchant's display name (Product.store), `storeHandle` the mock.shop store subdomain.
const publicItem = (r) => ({
	catalogId: r.catalogId,
	kind: r.kind,
	title: r.title,
	productType: r.productType,
	price: r.price,
	store: r.vendor,
	storeHandle: r.store,
	url: r.url,
	image_url: r.image_url,
	similar: true,
	model: "catalog",
	size: r.size,
});

/** Usable catalog items (CatalogItem shape plus storeHandle). Cached. */
export function loadCatalog() {
	return cache().usable.map(publicItem);
}

/** Every model that is not usable, with the reasons. Also returns warnings for usable ones in `warnings`. */
export function validateCatalog() {
	const c = cache();
	return c.all
		.filter((r) => !r.ok)
		.map((r) => ({
			catalogId: r.catalogId,
			kind: r.kind,
			title: r.title,
			problems: r.problems,
			bbox: r.bbox || null,
		}));
}
export function catalogWarnings() {
	return cache()
		.all.filter((r) => r.ok && r.warnings.length)
		.map((r) => ({ catalogId: r.catalogId, warnings: r.warnings }));
}
/** Internal records (measurements, colours) for tests. */
export function catalogRecords() {
	return cache().all;
}

export function catalogItem(catalogId) {
	const r = cache().byId.get(String(catalogId || ""));
	return r ? publicItem(r) : null;
}

// ---------- support surfaces ----------
const SEATING = new Set([
	"sofa",
	"armchair",
	"bench",
	"ottoman",
	"dining-chair",
	"office-chair",
	"stool",
	"pet-bed",
]);
const STORAGE = new Set([
	"bookcase",
	"cabinet",
	"wardrobe",
	"dresser",
	"nightstand",
	"desk",
	"dining-table",
	"coffee-table",
	"side-table",
	"console-table",
	"tray",
]);
/** Names each surface (seat, arm, top, mattress, shelf N) so the editor can ask for "the middle shelf" or "the seat". */
function labelSupports(kind, list, H) {
	let out = list.map((p) => ({ ...p }));
	if (STORAGE.has(kind) && out.length) {
		const big = Math.max(...out.map((p) => p.area));
		out = out.filter((p) => p.area >= 0.15 * big);
	} // props modelled on shelves
	const narrow = (p) => Math.min(p.x1 - p.x0, p.z1 - p.z0) < 0.15;
	for (const p of out) if (p.y >= H - 0.02) p.name = "top";
	if (SEATING.has(kind)) {
		for (const p of out) if (!p.name && narrow(p)) p.name = "arm";
		const cand = out.filter((p) => !p.name && p.y < 0.75 * H);
		const best = cand.sort((a, b) => b.area - a.area)[0];
		if (best)
			for (const p of cand) if (Math.abs(p.y - best.y) <= 0.03) p.name = "seat";
	} else if (kind === "bed") {
		const best = out
			.filter((p) => !p.name || p.name === "top")
			.sort((a, b) => b.area - a.area)[0];
		if (best) best.name = "mattress";
	}
	let n = 0;
	for (const p of out.sort((a, b) => a.y - b.y))
		if (!p.name) p.name = `shelf ${++n}`;
	return out;
}
/**
 * Support surfaces of a usable catalog item in its object frame (bottom-center origin, front +Z), scaled to `size`
 * when the object was resized. [{ name, y, x0, x1, z0, z1, clear }] or [].
 */
export function catalogSupports(catalogId, size) {
	const r = cache().byId.get(String(catalogId || ""));
	const list = r?.m?.supports;
	if (!list?.length || !r.bbox) return [];
	// Same scale the renderer applies (uniform fit + at most 1.25 extra stretch per axis), so surfaces match what is drawn.
	const k = fitScale(r.bbox, {
		x: size?.x || r.size.x,
		y: size?.y || r.size.y,
		z: size?.z || r.size.z,
	});
	return labelSupports(r.kind, list, r.bbox.y).map((p) => ({
		name: p.name,
		y: r3(p.y * k.y),
		x0: r3(p.x0 * k.x),
		x1: r3(p.x1 * k.x),
		z0: r3(p.z0 * k.z),
		z1: r3(p.z1 * k.z),
		clear: p.clear == null ? null : r3(p.clear * k.y),
		...(p.mask && { mask: p.mask }),
	}));
}

/** Raw measured size of a usable catalog model (what the renderer fits into the object's size box), or null. */
export function catalogRaw(catalogId) {
	const r = cache().byId.get(String(catalogId || ""));
	return r?.bbox ? { ...r.bbox } : null;
}

/** The model source for a usable catalog id, or null. */
export function catalogCode(catalogId) {
	const r = cache().byId.get(String(catalogId || ""));
	if (!r) return null;
	try {
		return fs.readFileSync(path.join(CATALOG_DIR, r.modelFile), "utf8");
	} catch {
		return null;
	}
}

/** Fields buildOps should put on the SceneObject for a catalog product (shape "custom", status "building"). */
export function catalogObject(catalogId) {
	const r = cache().byId.get(String(catalogId || ""));
	if (!r) return null;
	return {
		name: r.title,
		shape: "custom",
		status: "building",
		color: r.color,
		size: { ...r.size },
		description: `${r.title}, ${r.productType.toLowerCase()} by ${r.vendor}: ${r.look}`,
		product: {
			title: r.title,
			price: r.price,
			store: r.vendor,
			url: r.url,
			image_url: r.image_url,
			catalogId: r.catalogId,
			similar: true,
			model: "catalog",
		},
	};
}

/** /api/asset fast path: one "done" event for a catalog id, or null when the id is unknown/unusable. */
export function catalogAssetEvent(catalogId) {
	const t0 = Date.now();
	const code = catalogCode(catalogId);
	return code
		? {
				type: "done",
				code,
				ms: Date.now() - t0,
				via: "catalog",
				model: `catalog:${catalogId}`,
			}
		: null;
}

// ---------- prompt block ----------
const dimStr = (s) => `${s.x}×${s.y}×${s.z}`;
// Grouped by kind (the kind is also the catalogId prefix): saves ~1k chars over repeating a kind column on every line.
export function catalogPromptBlock() {
	// The title is left out when the id already spells it ("sofa/03-junction" = "Junction"): saves ~1.3k chars.
	const out = [
		"SHOP CATALOG: real products with ready 3D models. Grouped by [kind]. Lines: catalogId | title (when the id does not spell it) | type | price | W×H×D m | look",
	];
	const slug = (t) =>
		t
			.toLowerCase()
			.replace(/['’]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	let kind = null;
	for (const r of cache().usable) {
		if (r.kind !== kind) {
			kind = r.kind;
			out.push(`[${kind}]`);
		}
		const title =
			r.catalogId.split("/")[1].replace(/^\d+-/, "") === slug(r.title)
				? ""
				: r.title;
		const type = r.title.toLowerCase().includes(r.productType.toLowerCase())
			? ""
			: r.productType;
		out.push(
			[r.catalogId, title, type, r.price, dimStr(r.size), r.look]
				.filter(Boolean)
				.join(" | "),
		);
	}
	return out.join("\n");
}

// ---------- picking ----------
const KIND_SYNONYMS = [
	// multi-word phrases first
	[
		/\b(bed ?side|night) (table|stand|cabinet)\b|\bnight ?stand\b/,
		["nightstand"],
	],
	[/\b(end|side|accent) table\b/, ["side-table"]],
	[/\b(coffee|cocktail|center|centre) table\b/, ["coffee-table"]],
	[/\b(dining|kitchen|dinner) table\b/, ["dining-table"]],
	[/\b(console|hall(way)?|entry(way)?|sofa) table\b/, ["console-table"]],
	[/\b(dining|kitchen) chair\b/, ["dining-chair"]],
	[/\b(office|desk|task|computer|swivel|gaming) chair\b/, ["office-chair"]],
	[
		/\b(arm ?chair|lounge chair|accent chair|reading chair|rocking chair|recliner|club chair|wing ?chair)\b/,
		["armchair"],
	],
	[/\b(floor|reading|standing|arc) lamp\b/, ["floor-lamp"]],
	[/\b(chest of drawers|tall ?boy)\b/, ["dresser"]],
	[
		/\b(tv|media) (stand|unit|console|cabinet)\b|\bsideboard|credenza|buffet\b/,
		["cabinet"],
	],
	[
		/\b(somewhere|place|something) to sit\b|\bseating\b|\bseat\b/,
		["sofa", "armchair", "bench", "dining-chair", "stool", "ottoman"],
	],
	[/\b(somewhere|place) to sleep\b/, ["bed"]],
	[
		/\b(sofa|couch|settee|loveseat|love seat|sectional|chesterfield|divan)s?\b/,
		["sofa"],
	],
	[/\barm ?chairs?\b/, ["armchair"]],
	[/\bchairs?\b/, ["armchair", "dining-chair", "office-chair"]],
	[/\b(stool|barstool|bar stool)s?\b/, ["stool"]],
	[/\bbench(es)?\b/, ["bench"]],
	[/\b(ottoman|pouf|pouffe|footstool|footrest|hassock)s?\b/, ["ottoman"]],
	[/\bdesk|workstation|writing table|secretary\b/, ["desk"]],
	[
		/\btables?\b/,
		["coffee-table", "dining-table", "side-table", "console-table"],
	],
	[/\b(bed|bunk|bedframe|bed frame)s?\b/, ["bed"]],
	[/\b(dresser|drawers)\b/, ["dresser"]],
	[/\b(wardrobe|closet|armoire)s?\b/, ["wardrobe"]],
	[/\b(bookcase|bookshelf|bookshelves|shelf|shelves|shelving)\b/, ["bookcase"]],
	[/\b(cabinet|cupboard|hutch)s?\b/, ["cabinet"]],
	[/\b(lamp|light|lighting)s?\b/, ["floor-lamp"]],
	[/\b(rug|carpet|mat|runner)s?\b/, ["rug"]],
];
const COLOR_WORDS = {
	gray: "grey",
	"off-white": "cream",
	ivory: "cream",
	natural: "beige",
	sand: "beige",
	camel: "tan",
	chocolate: "dark brown",
	mustard: "mustard",
	gold: "brass",
	golden: "brass",
	silver: "metal",
	ochre: "mustard",
	terracotta: "rust",
};
const COLOR_FAMILY = {
	blue: ["blue", "navy", "slate blue", "teal"],
	navy: ["navy", "blue", "slate blue"],
	teal: ["teal", "blue", "green"],
	green: ["green", "sage", "olive", "dark green", "teal"],
	sage: ["sage", "green", "olive"],
	olive: ["olive", "sage", "green", "mustard"],
	grey: ["grey", "light grey", "dark grey", "charcoal", "taupe"],
	"light grey": ["light grey", "grey", "white"],
	"dark grey": ["dark grey", "charcoal", "grey"],
	charcoal: ["charcoal", "dark grey", "black"],
	black: ["black", "charcoal", "dark grey"],
	white: ["white", "cream", "light grey"],
	cream: ["cream", "white", "beige"],
	beige: ["beige", "cream", "tan", "taupe"],
	tan: ["tan", "beige", "brown"],
	taupe: ["taupe", "beige", "grey"],
	brown: ["brown", "dark brown", "tan", "rust"],
	"dark brown": ["dark brown", "brown"],
	red: ["red", "burgundy", "rust"],
	orange: ["orange", "rust", "peach"],
	rust: ["rust", "orange", "red", "brown"],
	yellow: ["yellow", "mustard"],
	mustard: ["mustard", "yellow", "olive"],
	pink: ["pink", "peach", "plum"],
	purple: ["purple", "plum"],
};
const COLORS = [
	"black",
	"charcoal",
	"dark grey",
	"grey",
	"light grey",
	"white",
	"cream",
	"beige",
	"taupe",
	"tan",
	"brown",
	"dark brown",
	"red",
	"burgundy",
	"pink",
	"rust",
	"orange",
	"peach",
	"yellow",
	"mustard",
	"olive",
	"sage",
	"green",
	"dark green",
	"teal",
	"blue",
	"navy",
	"slate blue",
	"purple",
	"plum",
];
const WOOD = [
	"wood",
	"wooden",
	"oak",
	"walnut",
	"birch",
	"teak",
	"pine",
	"ash",
	"plywood",
	"timber",
];

function kindsFor(q) {
	for (const [re, kinds] of KIND_SYNONYMS)
		if (re.test(q)) return { kinds, exact: kinds.length === 1 };
	return { kinds: [], exact: false };
}
function priceCap(q) {
	const m = q.match(
		/\b(?:under|below|less than|max(?:imum)?|up to|within|<)\s*\$?\s*(\d[\d,]*)(k)?\b/,
	);
	if (m) return +m[1].replace(/,/g, "") * (m[2] ? 1000 : 1);
	const m2 = q.match(/\$\s*(\d[\d,]*)\s*(?:or less|max|budget)/);
	return m2 ? +m2[1].replace(/,/g, "") : null;
}

/**
 * Best catalog matches for a free-text request. Returns [{ ...CatalogItem, score, why }] best first; [] when nothing
 * reasonable matches (e.g. "a throne"), so the caller can fall back to a generated custom object.
 */
export function pickCatalog(query, { kind, maxPrice, color, limit = 5 } = {}) {
	const q = String(query || "")
		.toLowerCase()
		.replace(/[^\w$,\s'-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const usable = cache().usable;
	const found = kind ? { kinds: [].concat(kind), exact: true } : kindsFor(q);
	const cap = maxPrice ?? priceCap(q);
	const wantColors = [];
	for (const [a, b] of Object.entries(COLOR_WORDS))
		if (new RegExp(`\\b${a}\\b`).test(q)) wantColors.push(b);
	for (const c of COLORS)
		if (new RegExp(`\\b${c}\\b`).test(q)) wantColors.push(c);
	if (color)
		wantColors.push(
			...[]
				.concat(color)
				.map((c) =>
					/^#?[0-9a-f]{6}$/i.test(c) ? colorName(c) : String(c).toLowerCase(),
				),
		);
	const wantWood = WOOD.some((w) => new RegExp(`\\b${w}\\b`).test(q));
	const wantMats = MAT_WORDS.filter(
		(w) => w !== "wood" && new RegExp(`\\b${w}\\b`).test(q),
	);
	const cheap =
		/\b(cheap|cheapest|budget|affordable|inexpensive|low[- ]cost|bargain)\b/.test(
			q,
		);
	const pricey =
		/\b(expensive|luxury|luxurious|premium|high[- ]end|fancy|designer)\b/.test(
			q,
		);
	const big = /\b(big|large|huge|long|wide|spacious|family)\b/.test(q);
	const small = /\b(small|little|compact|tiny|narrow|mini)\b/.test(q);
	const EXPAND = {
		tv: "media",
		television: "media",
		bedside: "bedside nightstand",
		kids: "children",
		kid: "children",
		child: "children",
		closet: "closet wardrobe",
	};
	const words = q
		.split(" ")
		.flatMap((w) => (EXPAND[w] || w).split(" "))
		.filter(
			(w) =>
				w.length > 2 &&
				![
					"the",
					"and",
					"for",
					"with",
					"add",
					"put",
					"want",
					"need",
					"some",
					"one",
					"that",
					"this",
					"room",
					"please",
					"under",
					"table",
					"chair",
				].includes(w),
		);

	const pool = found.kinds.length
		? usable.filter((r) => found.kinds.includes(r.kind))
		: usable;
	const scored = [];
	for (const r of pool) {
		if (cap != null && r.priceValue > cap) continue;
		let score = 0;
		const why = [];
		if (found.kinds.length) {
			score +=
				(found.exact ? 10 : 7) +
				0.1 * (found.kinds.length - found.kinds.indexOf(r.kind));
			why.push("kind");
		}
		const hay = `${r.title} ${r.productType} ${r.look}`.toLowerCase();
		const nameHits = words.filter((w) =>
			new RegExp(`\\b${w.replace(/[^\w'-]/g, "")}`).test(
				`${r.title} ${r.productType}`.toLowerCase(),
			),
		);
		if (nameHits.length) {
			score += 3 * nameHits.length;
			why.push("name:" + nameHits.join("/"));
		}
		let cs = 0;
		for (const c of wantColors) {
			const fam = COLOR_FAMILY[c] || [c];
			r.colorNames.forEach((n, i) => {
				const w = i === 0 ? 1 : i === 1 ? 0.5 : 0.25;
				if (n === c) cs = Math.max(cs, 4 * w);
				else if (fam.includes(n)) cs = Math.max(cs, 2.5 * w);
			});
			if (!cs && hay.includes(c)) cs = 1;
		}
		if (cs) {
			score += cs;
			why.push("colour");
		}
		if (
			wantWood &&
			(/\b(wood|oak|walnut|birch|teak|pine|plywood)\b/.test(hay) ||
				/brown|tan/.test(r.look))
		) {
			score += 3;
			why.push("wood");
		}
		for (const w of wantMats)
			if (hay.includes(w)) {
				score += 3;
				why.push(w);
			}
		if (
			/\bkids?\b|\bchild(ren)?'?s?\b/.test(q)
				? /children/.test(hay)
				: /children/.test(hay)
		)
			score += /\bkids?\b|\bchild/.test(q) ? 4 : -2;
		const priceRank = Math.log10(Math.max(10, r.priceValue)); // ~1.6 .. 4.2
		if (cheap) {
			score += (4.2 - priceRank) * 2;
			why.push("cheap");
		}
		if (pricey) {
			score += (priceRank - 1.6) * 1.5;
			why.push("premium");
		}
		const foot = r.size.x * r.size.z;
		if (big) score += Math.min(3, foot * 1.2);
		if (small) score -= Math.min(3, foot * 1.2);
		if (
			/\breading\b/.test(q) &&
			r.kind === "floor-lamp" &&
			/arc|shelf|counterbalance/.test(hay)
		)
			score += 1;
		if (!found.kinds.length && !nameHits.length) continue; // nothing ties it to the request
		scored.push({
			...publicItem(r),
			score: +score.toFixed(2),
			why: why.join(","),
		});
	}
	scored.sort(
		(a, b) => b.score - a.score || a.catalogId.localeCompare(b.catalogId),
	);
	// Without a kind match, only accept confident name matches (avoids "throne" -> random product).
	const out = found.kinds.length ? scored : scored.filter((s) => s.score >= 6);
	return out.slice(0, limit);
}
