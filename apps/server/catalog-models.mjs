// Batch: turn catalog product photos into three.js build(THREE) models with Gemini.
// Usage: node apps/server/catalog-models.mjs [--per-kind N] [--kind sofa,bed] [--force] [--concurrency N]
//        node apps/server/catalog-models.mjs --fix fixes.json
//   fixes.json: [{ "modelFile": "stool/01-x.build.js", "feedback": "what looks wrong", "render": "/abs/render.png" (optional) }]
//   Sends photo + current render + current code + feedback, overwrites the model file.
// Writes <kind>/<image-basename>.build.js next to each image and sets `modelFile` in catalog.json.
import fs from "node:fs";
import path from "node:path";
import { CATALOG_JSON as CATALOG, CATALOG_DIR } from "@gemini-hack/catalog";
import { cleanCode, DIRECT_MODEL, validateCode } from "./asset.mjs";
import { describeTarget } from "./catalog-dims.mjs";
import { generateContent, SERVER_DIR, scrub, textOf } from "./lib.mjs";

const SYSTEM = fs.readFileSync(
	path.join(SERVER_DIR, "prompts", "codegen.txt"),
	"utf8",
);

const arg = (name, dflt) => {
	const i = process.argv.indexOf(name);
	return i > 0 ? process.argv[i + 1] : dflt;
};
const PER_KIND = +arg("--per-kind", 1);
const KINDS = arg("--kind", "") ? new Set(arg("--kind").split(",")) : null;
const FORCE = process.argv.includes("--force");
const CONCURRENCY = +arg("--concurrency", 20);
const MODEL = arg("--model", DIRECT_MODEL);
const FIXES = arg("--fix", "")
	? JSON.parse(fs.readFileSync(arg("--fix"), "utf8"))
	: null;

const modelPathFor = (e) =>
	e.imageFile.replace(/\.(png|jpe?g|webp)$/i, ".build.js");

// Extra rules per kind (non-furniture room items). Light-emitting parts are named emit_* so the renderer can put a real light there.
const EMIT =
	'Name every light-emitting part (bulb, glowing diffuser, flame, LED strip, lit screen) with a mesh.name starting with "emit_" and give it an emissive material (emissive color = light color, emissiveIntensity about 1.5). Lamp shades stay non-emissive; put the emit_ bulb inside them.';
const WALL =
	"It hangs on a wall: the back is flat and lies in the plane z = min (all parts are in front of it), the front faces +Z, and it is at its real hanging size. ORIGIN: bottom-center of its bounding box as usual.";
const SMALL =
	"It is a small object: use as few meshes as the shape needs (3-20 is fine); ignore the 12-mesh minimum.";
const KIND_HINTS = {
	"table-lamp": EMIT,
	"pendant-light": `${EMIT} It hangs from the ceiling: include the canopy plate at the very top (y = max) and the cord or rod down to the fixture; total height about 0.6-1.0 m unless the photo shows otherwise.`,
	"string-lights": `${EMIT} Model it hanging in a gentle catenary swag about 1.5-2 m wide on a wall (back flat at z = min), bulbs as small emit_ spheres.`,
	candle: `${SMALL} ${EMIT} Show the candle lit: a small emit_flame teardrop above the wick.`,
	"computer-monitor": `${EMIT} The screen is ON: an emit_screen panel slightly in front of the bezel, dim blue-white (emissiveIntensity about 0.6).`,
	television: `${EMIT} The screen is ON: an emit_screen panel slightly in front of the bezel, dim blue-white (emissiveIntensity about 0.6). Include its stand or console only if the photo shows the TV as the product on it.`,
	laptop: `${SMALL} Pose it OPEN at about 105 degrees with the screen at the back (-Z) facing +Z and the keyboard deck toward the viewer. ${EMIT.replace("lit screen", "lit screen (emit_screen, emissiveIntensity about 0.6)")}`,
	"wall-clock": `${WALL} ${SMALL} Hands and tick marks as thin boxes; no numerals.`,
	"wall-art": `${WALL} No textures or text: approximate the artwork with flat colored shapes (boxes, extruded shapes) layered just in front of the canvas, and model the frame, canvas depth, macrame or relief as geometry.`,
	mirror: `${WALL.replace("It hangs on a wall", "Unless the photo shows a floor-standing or tabletop mirror, it hangs on a wall")} Mirror glass: MeshStandardMaterial color #dfe4e8, metalness 1, roughness 0.05.`,
	curtain: `${WALL.replace("It hangs on a wall", "It hangs at a window")} Model ONE pair (or the panel set shown) hanging from its rod: folded panels as wavy extruded shapes or rows of vertical half-cylinders, rod and rings/tabs on top, about 1.4 m wide and 2.2-2.4 m tall unless the listing says otherwise.`,
	wreath: `${WALL} Ring of foliage approximated by many small leaf/berry primitives around a torus.`,
	"throw-pillow": `${SMALL} Soft, rounded on all edges (scaled spheres, capsules or LatheGeometry), no sharp boxes.`,
	"throw-blanket":
		"Show it neatly FOLDED as in the photo (or folded if the photo shows it draped), with rounded edges and fringe if any; no sharp boxes.",
	book: `${SMALL} One closed book lying flat, front cover up, spine on the -X side; cover color blocks, page block in off-white.`,
	mug: SMALL,
	vase: SMALL,
	tray: SMALL,
	keyboard:
		"Keys may be a grid of small boxes (up to about 110 meshes is fine for keys); reuse one key geometry and material.",
	"potted-plant":
		"Leaves as flattened scaled spheres, extruded leaf shapes or thin planes in several greens arranged by a deterministic loop (no randomness); pot and soil included. Up to about 120 meshes is fine for leaves.",
	"christmas-tree":
		"Stacked cones or tiers as in the photo, deterministic placement of any ornaments.",
	pumpkin: `${SMALL} Lobed body from several scaled spheres or a lathe with ribs; stem on top. If it is a jack-o-lantern, add the carved face as dark inset shapes and an emit_ glow inside. ${EMIT}`,
};

function prompt(e) {
	return `Build a three.js model of the product in the attached photo.
Product: ${e.name} (${e.productType}, category: ${e.kind}).
Match the photo closely: silhouette, proportions, number and shape of legs/arms/cushions/drawers, materials and colors.
${KIND_HINTS[e.kind] ? KIND_HINTS[e.kind] + "\n" : ""}${e.listing ? `Product listing size (${e.listing.option}: ${e.listing.value}). The model MUST match exactly: ${describeTarget(e.listing.target)}. Pick realistic values for any dimension the listing does not give.` : "Pick a realistic real-world size for this kind of product."}
State the dimensions as named constants at the top of the function.
Respond with only the code in a single \`\`\`javascript block, no explanation.`;
}

function fixPrompt(e, fix) {
	const current = fs.readFileSync(
		path.join(CATALOG_DIR, modelPathFor(e)),
		"utf8",
	);
	return `${prompt(e)}

This is a FIX of an existing model. The first image is the product photo${fix.render ? "; the second image is a render of the current model" : ""}.
A reviewer compared them and found these problems:
${fix.feedback}

Fix those problems so the model matches the photo. Keep everything else that already looks right.
Current code:
\`\`\`javascript
${current.slice(0, 30000)}
\`\`\``;
}

async function buildOne(e, fix) {
	const img = fs
		.readFileSync(path.join(CATALOG_DIR, e.imageFile))
		.toString("base64");
	const mime = /\.png$/i.test(e.imageFile) ? "image/png" : "image/jpeg";
	const base = fix ? fixPrompt(e, fix) : prompt(e);
	const images = [{ inlineData: { mimeType: mime, data: img } }];
	if (fix?.render)
		images.push({
			inlineData: {
				mimeType: "image/png",
				data: fs.readFileSync(fix.render).toString("base64"),
			},
		});
	let text = base;
	let last = "";
	for (let attempt = 1; attempt <= 3; attempt++) {
		const js = await generateContent(
			MODEL,
			{
				systemInstruction: { parts: [{ text: SYSTEM }] },
				contents: [{ role: "user", parts: [...images, { text }] }],
				generationConfig: {
					thinkingConfig: { thinkingLevel: "low" },
					maxOutputTokens: 32768,
				},
			},
			{ timeoutMs: 150000 },
		);
		const code = cleanCode(textOf(js));
		const v = validateCode(code);
		if (v.ok) return { code, v, attempt };
		last = v.error;
		text =
			base +
			`\n\nA previous attempt failed validation with: ${v.error}\nPrevious code:\n\`\`\`javascript\n${code.slice(0, 20000)}\n\`\`\`\nReturn the corrected complete code only.`;
	}
	throw new Error("invalid code after 3 attempts: " + last);
}

async function pool(items, n, fn) {
	const out = [];
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(n, items.length) }, async () => {
			while (i < items.length) {
				const k = i++;
				out[k] = await fn(items[k]);
			}
		}),
	);
	return out;
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const seen = {};
const fixFor = (e) => FIXES?.find((f) => f.modelFile === modelPathFor(e));
const jobs = catalog.filter((e) => {
	if (FIXES) return !!fixFor(e);
	if (KINDS && !KINDS.has(e.kind)) return false;
	seen[e.kind] = (seen[e.kind] || 0) + 1;
	if (seen[e.kind] > PER_KIND) return false;
	return FORCE || !fs.existsSync(path.join(CATALOG_DIR, modelPathFor(e)));
});
console.log(
	`[models] ${jobs.length} jobs, model ${MODEL}, concurrency ${CONCURRENCY}`,
);

const t0 = Date.now();
const results = await pool(jobs, CONCURRENCY, async (e) => {
	const t = Date.now();
	try {
		const r = await buildOne(e, fixFor(e));
		const rel = modelPathFor(e);
		fs.writeFileSync(path.join(CATALOG_DIR, rel), r.code);
		console.log(
			`OK   ${e.kind.padEnd(14)} ${rel}  ${r.v.meshes} meshes, bbox ${r.v.bbox.x}x${r.v.bbox.y}x${r.v.bbox.z} m, try ${r.attempt}, ${((Date.now() - t) / 1000).toFixed(0)}s`,
		);
		return { e, rel };
	} catch (err) {
		console.log(
			`FAIL ${e.kind.padEnd(14)} ${e.imageFile}: ${scrub(err.message).slice(0, 200)}`,
		);
		return { e, rel: null };
	}
});

// Re-read catalog.json before writing so concurrent edits to it are kept.
const fresh = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
for (const entry of fresh) {
	if (fs.existsSync(path.join(CATALOG_DIR, modelPathFor(entry))))
		entry.modelFile = modelPathFor(entry);
}
fs.writeFileSync(CATALOG, JSON.stringify(fresh, null, 2) + "\n");
const ok = results.filter((r) => r.rel).length;
console.log(
	`[models] done: ${ok}/${jobs.length} ok in ${((Date.now() - t0) / 1000).toFixed(0)}s`,
);
