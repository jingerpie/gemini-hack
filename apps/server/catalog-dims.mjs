// Listing dimensions for catalog products.
// Usage: node apps/server/catalog-dims.mjs [--fetch] [--fixes out.json] [--tol 0.05]
//   --fetch       read each product's size option from its mock.shop Storefront API and store it as
//                 `listing` in catalog.json: { option, value, target: { x?, y?, z?, seatHeight?, footprint? } } (meters)
//   (always)      compare each model's bounding box with the target and print mismatches
//   --fixes FILE  write a --fix job file for catalog-models.mjs with one entry per mismatch
// Products list one or two measurements at most (width, length, diameter, mattress size...), as size variants.
// The first (default) variant is the target; axes the listing does not give are left to the model.
import fs from "node:fs";
import path from "node:path";
import { CATALOG_JSON as CATALOG, CATALOG_DIR } from "@gemini-hack/catalog";
import { validateCode } from "./asset.mjs";
import { SERVER_DIR } from "./lib.mjs";

const arg = (name, dflt) => {
	const i = process.argv.indexOf(name);
	return i > 0 ? process.argv[i + 1] : dflt;
};
const TOL = +arg("--tol", 0.05);

const toM = (n, unit) =>
	n *
	({
		mm: 0.001,
		cm: 0.01,
		m: 1,
		in: 0.0254,
		inch: 0.0254,
		inches: 0.0254,
		ft: 0.3048,
		feet: 0.3048,
	}[unit.toLowerCase()] ?? 0.01);
const nums = (s) => [...s.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => +m[1]);
const unitOf = (s) =>
	(s.match(/\b(mm|cm|m|inches|inch|in|feet|ft)\b/i) || [undefined, "cm"])[1];

/** Parse one size option value into target dimensions in meters. Front faces +Z, so width/length run along x. */
// Kinds whose listing size does not describe the model's bounding box (string length, nursery pot, unfolded throw...).
const NO_LISTING = new Set([
	"string-lights",
	"potted-plant",
	"throw-blanket",
	"speaker",
	"turntable",
	"christmas-tree",
]);
// Flat things that stand or hang upright: a two-number size is width × height, a diameter is width = height.
const UPRIGHT = new Set([
	"wall-art",
	"mirror",
	"curtain",
	"throw-pillow",
	"wall-clock",
	"wreath",
	"television",
	"computer-monitor",
]);

export function parseSize(option, value, kind) {
	const o = option.toLowerCase();
	if (
		NO_LISTING.has(kind) ||
		/shade|driver|cable|capacity|suspension|cord|bulb|nursery|pot diameter/.test(
			o,
		)
	)
		return null;
	// "L13 (304 × 215 × 16 mm)" -> the bracket part; "120 × 180 cm (standard)" / "(W × D × H)" -> drop the brackets.
	const br = value.match(/\(([^)]*\d[^)]*)\)/);
	value =
		br &&
		!/\d\s*(mm|cm|m|in|inch|inches|ft|"|×|x)/i.test(value.replace(br[0], ""))
			? br[1]
			: value.replace(/\([^)]*\)/g, "");
	const u = unitOf(value);
	const n = nums(value).map((v) => toM(v, u));
	if (!n.length) return null;
	if (UPRIGHT.has(kind)) {
		if (/diameter/.test(o) || /diameter/i.test(value))
			return { x: n[0], y: n[0] };
		if (n.length >= 2 && /×|x/.test(value)) return { x: n[0], y: n[1] };
		if (kind === "curtain" && /length|drop|height/.test(o)) return { y: n[0] };
		if (/^height/.test(o)) return { y: n[0] };
		if (/width/.test(o)) return { x: n[0] };
		return null;
	}
	if (kind === "pendant-light" && /length|drop/.test(o)) return null;
	if (n.length >= 3 && /×|x/.test(value))
		return kind === "laptop"
			? { x: n[0], z: n[1] }
			: { x: n[0], z: n[1], y: n[2] }; // L × W × H
	if (/seat height/.test(o)) return { seatHeight: n[0] }; // ranges: lowest setting
	if (/mattress/.test(o)) return { mattress: { x: n[0], z: n[1] } };
	if (/opening/.test(o) && n.length >= 2) return { x: n[0], y: n[1] }; // door opening: width × height
	if (/diameter/.test(o) || /diameter/i.test(value)) {
		const t = { x: n[0], z: n[0] };
		if (/high/i.test(value) && n[1]) t.y = n[1];
		return t;
	}
	if (/^height/.test(o)) return { y: n[0] };
	if (n.length >= 2 && /×|x/.test(value)) {
		// "110 × 60 cm" (desk W × D) or rug "120 × 180 cm" (footprint, either orientation).
		return kind === "rug"
			? { footprint: [n[0], n[1]].sort((a, b) => a - b) }
			: { x: n[0], z: n[1] };
	}
	if (/width|length|wall/.test(o)) return { x: n[0] };
	return null;
}

/** Human-readable target, for prompts. */
export function describeTarget(t) {
	const cm = (v) => `${Math.round(v * 100)} cm`;
	const parts = [];
	if (t.x != null) parts.push(`overall width along x = ${cm(t.x)}`);
	if (t.y != null) parts.push(`overall height along y = ${cm(t.y)}`);
	if (t.z != null) parts.push(`overall depth along z = ${cm(t.z)}`);
	if (t.footprint)
		parts.push(
			`footprint ${cm(t.footprint[0])} × ${cm(t.footprint[1])} (short side along x, long side along z)`,
		);
	if (t.mattress)
		parts.push(
			`it holds a ${cm(t.mattress.x)} × ${cm(t.mattress.z)} mattress (the frame is slightly larger than the mattress)`,
		);
	if (t.seatHeight != null)
		parts.push(`seat surface height = ${cm(t.seatHeight)} from the floor`);
	return parts.join("; ");
}

/** Check a bounding box (meters) against a target. Returns a list of problems. */
export function checkBox(bbox, t, tol = TOL) {
	const bad = [];
	const off = (got, want) => Math.abs(got - want) / want > tol;
	const cm = (v) => `${Math.round(v * 100)} cm`;
	for (const ax of ["x", "y", "z"])
		if (t[ax] != null && off(bbox[ax], t[ax]))
			bad.push(`${ax} is ${cm(bbox[ax])}, listing says ${cm(t[ax])}`);
	if (t.footprint) {
		const [a, b] = [bbox.x, bbox.z].sort((p, q) => p - q);
		if (off(a, t.footprint[0]) || off(b, t.footprint[1]))
			bad.push(
				`footprint is ${cm(a)} × ${cm(b)}, listing says ${cm(t.footprint[0])} × ${cm(t.footprint[1])}`,
			);
	}
	if (t.mattress) {
		// Frame must fit the mattress and not be much bigger: +0 to +35 cm per side. Either orientation (bunk beds run along x).
		const [a, b] = [bbox.x, bbox.z].sort((p, q) => p - q);
		const [mw, ml] = [t.mattress.x, t.mattress.z].sort((p, q) => p - q);
		const fits = (got, want) => got - want >= -0.01 && got - want <= 0.35;
		if (!fits(a, mw) || !fits(b, ml))
			bad.push(
				`footprint is ${cm(a)} × ${cm(b)}, should be ${cm(mw)}-${cm(mw + 0.35)} × ${cm(ml)}-${cm(ml + 0.35)} to hold a ${cm(mw)} × ${cm(ml)} mattress`,
			);
	}
	return bad;
}

async function fetchListing(e) {
	const r = await fetch(`https://${e.store}.mock.shop/api`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: `{ product(handle: ${JSON.stringify(e.handle)}) { options { name values } } }`,
		}),
	});
	const opts = (await r.json()).data?.product?.options || [];
	for (const op of opts) {
		if (!op.values.some((v) => /\d/.test(v))) continue;
		const target = parseSize(op.name, op.values[0], e.kind);
		if (target)
			return {
				option: op.name,
				value: op.values[0],
				variants: op.values,
				target,
			};
	}
	return null;
}

const isMain =
	process.argv[1] &&
	path.resolve(process.argv[1]) ===
		path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
	const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
	if (process.argv.includes("--fetch")) {
		await Promise.all(
			catalog.map(async (e) => {
				try {
					const l = await fetchListing(e);
					if (l) e.listing = l;
					else delete e.listing;
				} catch (err) {
					console.log(`fetch failed ${e.imageFile}: ${err.message}`);
				}
			}),
		);
		// Re-read before writing so concurrent edits (modelFile) are kept.
		const fresh = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
		for (const f of fresh) {
			const e = catalog.find((c) => c.imageFile === f.imageFile);
			if (e?.listing) f.listing = e.listing;
			else delete f.listing;
		}
		fs.writeFileSync(CATALOG, JSON.stringify(fresh, null, 2) + "\n");
		console.log(
			`[dims] ${fresh.filter((e) => e.listing).length}/${fresh.length} products list a size`,
		);
	}
	const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
	const fixes = [];
	let ok = 0;
	let checked = 0;
	for (const e of cat) {
		if (!e.listing || !e.modelFile) continue;
		const t = e.listing.target;
		if (t.seatHeight != null && Object.keys(t).length === 1) continue; // seat height is not a bbox axis
		checked++;
		const v = validateCode(
			fs.readFileSync(path.join(CATALOG_DIR, e.modelFile), "utf8"),
		);
		if (!v.ok) {
			console.log(`INVALID ${e.modelFile}: ${v.error}`);
			continue;
		}
		const bad = checkBox(v.bbox, t);
		if (!bad.length) {
			ok++;
			continue;
		}
		console.log(`OFF  ${e.modelFile.padEnd(48)} ${bad.join("; ")}`);
		fixes.push({
			modelFile: e.modelFile,
			feedback: `The model's size does not match the product listing (${e.listing.option}: ${e.listing.value}). ${bad.join("; ")}.`,
		});
	}
	console.log(
		`[dims] ${ok}/${checked} models match their listing size (tolerance ${TOL * 100}%)`,
	);
	if (arg("--fixes")) {
		fs.writeFileSync(arg("--fixes"), JSON.stringify(fixes, null, 1));
		console.log(`[dims] wrote ${fixes.length} fixes to ${arg("--fixes")}`);
	}
}
