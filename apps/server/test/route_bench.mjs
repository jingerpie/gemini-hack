// Routing + fast-path bench (no server needed). Usage: node apps/server/test/route_bench.mjs
import fs from "node:fs";
import { buildOps, orchestrate } from "../patch.mjs";
import { applyOps, defaultScene } from "./patch_test.mjs";

const SINGLE = [
	"paint the walls black",
	"add a throne chair",
	"move the sofa a bit to the left",
	"make the sofa dark green velvet",
	"put a poster of Mount Fuji on the right wall",
	"make the floor white marble and the walls light grey",
	"add two plants in the back corners",
];
const WHOLE = [
	"make this a cozy reading room",
	"design this as a gaming den",
	"this feels empty, fix it",
	"make it feel more luxurious",
	"what would make this room better?",
	"turn it into a home office",
	"I want it to feel warmer and more Scandinavian",
];
const CHAIN = [
	"paint the walls black",
	"put a BMW logo on that wall",
	"I want a chair over there by the left wall, but make it look like a throne",
	"make the floor shiny",
	"move the logo a bit to the left",
	"hmm let me think about what else",
];

const summarize = (ops) =>
	ops
		.map((o) =>
			o.op === "surface"
				? `surface ${o.id} ${JSON.stringify(o.changes)}`
				: o.op === "add"
					? `add ${o.id} (${o.object.shape} ${o.object.name}) @(${o.object.position.x},${o.object.position.z}) rot${o.object.rotation_y_deg}`
					: o.op === "add_decal"
						? `add_decal ${o.id} on ${o.decal.surface} x${o.decal.x}`
						: `${o.op} ${o.id} ${JSON.stringify(o.changes || "")}`,
		)
		.join("; ") || "nothing";
const med = (a) => {
	const s = [...a].sort((x, y) => x - y);
	return s.length ? s[Math.floor((s.length - 1) / 2)] : Number.NaN;
};

async function route(u, i) {
	const t0 = Date.now();
	try {
		const calls = await orchestrate({
			scene: defaultScene(),
			history: [],
			utterance: u,
		});
		const ask = calls.find((c) => c.name === "ask_designer");
		return {
			u,
			kind: i,
			ms: Date.now() - t0,
			designer: !!ask,
			brief: ask?.args.brief,
			calls: calls.map((c) => c.name).join(","),
		};
	} catch (e) {
		return {
			u,
			kind: i,
			ms: Date.now() - t0,
			error: String(e.message).slice(0, 120),
		};
	}
}
async function chain(label, opts) {
	const scene = defaultScene();
	const history = [];
	const rows = [];
	for (const u of CHAIN) {
		const t0 = Date.now();
		try {
			const calls = await orchestrate({ scene, history, utterance: u }, opts);
			const ms = Date.now() - t0;
			const out = buildOps(calls, scene);
			applyOps(scene, out.ops);
			history.push({ u, applied: summarize(out.ops).slice(0, 300) });
			rows.push({
				u,
				ms,
				designer: calls.some((c) => c.name === "ask_designer"),
				applied: summarize(out.ops),
				say: out.say,
				dropped: out.dropped,
			});
		} catch (e) {
			rows.push({
				u,
				ms: Date.now() - t0,
				error: String(e.message).slice(0, 160),
			});
		}
	}
	return { label, rows };
}

const [routes, chains] = await Promise.all([
	Promise.all([
		...SINGLE.map((u) => route(u, "single")),
		...WHOLE.map((u) => route(u, "whole")),
	]),
	Promise.all([
		chain("hydrogen-low BEFORE (no ask_designer)", { withDesigner: false }),
		chain("hydrogen-low BEFORE (no ask_designer) #2", { withDesigner: false }),
		chain("hydrogen-low AFTER", {}),
		chain("hydrogen-low AFTER #2", {}),
		chain("neon-low AFTER", { model: "gemini-4-neon" }),
		chain("neon-low AFTER #2", { model: "gemini-4-neon" }),
	]),
]);

console.log("ROUTING (hydrogen low, with ask_designer)");
for (const r of routes)
	console.log(
		`  [${r.kind}] ${r.error ? "ERR " + r.error : r.designer ? "DESIGNER" : "fast    "} ${String(r.ms).padStart(5)}ms "${r.u}" ${r.brief ? "-> " + r.brief : r.calls || ""}`,
	);
const cm = {
	single: { fast: 0, designer: 0 },
	whole: { fast: 0, designer: 0 },
};
for (const r of routes)
	if (!r.error) cm[r.kind][r.designer ? "designer" : "fast"]++;
console.log("  confusion", JSON.stringify(cm));
for (const c of chains) {
	console.log(
		`\n${c.label}: median ${med(c.rows.filter((r) => !r.error).map((r) => r.ms))} ms`,
	);
	for (const r of c.rows)
		console.log(
			`  ${String(r.ms).padStart(5)}ms ${r.designer ? "[DESIGNER] " : ""}"${r.u}" -> ${r.error ? "ERR " + r.error : r.applied + " | say: " + r.say + (r.dropped.length ? " | dropped " + r.dropped : "")}`,
		);
}
fs.writeFileSync(
	new URL(`./out/route_bench_${Date.now()}.json`, import.meta.url),
	JSON.stringify({ routes, chains }, null, 2),
);
