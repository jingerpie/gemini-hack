// Designer model bench (no server needed). Usage: node apps/server/test/designer_bench.mjs [model ...]
// Runs the same briefs through each model in parallel, reports time, ops, dropped, overlaps, clamped placements, layout.
import fs from "node:fs";
import { buildOps, runDesigner } from "../patch.mjs";
import { defaultScene } from "./patch_test.mjs";

const SPECS = process.argv.slice(2).length
	? process.argv.slice(2)
	: [
			"gemini-4-argon",
			"gemini-4-neon",
			"gemini-4-carbon",
			"gemini-4-hydrogen@high",
		]; // model[@thinkingLevel]
const BRIEFS = [
	"make this a cozy reading room",
	"design this as a gaming den",
	"this feels empty, fix it",
	"make it feel more luxurious",
];

const ext = (o) => {
	const a = ((o.rotation_y_deg || 0) * Math.PI) / 180;
	const c = Math.abs(Math.cos(a));
	const s = Math.abs(Math.sin(a));
	return {
		ex: (o.size.x * c + o.size.z * s) / 2,
		ez: (o.size.x * s + o.size.z * c) / 2,
	};
};
function analyze(calls, scene) {
	const out = buildOps(calls, scene);
	const objs = new Map(scene.objects.map((o) => [o.id, structuredClone(o)]));
	for (const op of out.ops) {
		if (op.op === "add") objs.set(op.id, op.object);
		else if (op.op === "update") Object.assign(objs.get(op.id), op.changes);
		else if (op.op === "remove") objs.delete(op.id);
	}
	// clamped = raw add_object position differs from the sanitized one (model placed it outside the room)
	let clamped = 0;
	for (const c of calls.filter((c) => c.name === "add_object")) {
		const op = out.ops.find(
			(o) => o.op === "add" && o.object.name === String(c.args.name || ""),
		);
		const p = c.args.position || {};
		if (
			op &&
			(Math.abs((+p.x || 0) - op.object.position.x) > 0.05 ||
				Math.abs((+p.z || 0) - op.object.position.z) > 0.05)
		)
			clamped++;
	}
	const floor = [...objs.values()].filter(
		(o) => !o.parent && o.size.y > 0.05 && o.shape !== "plane",
	);
	const overlaps = [];
	for (let i = 0; i < floor.length; i++)
		for (let j = i + 1; j < floor.length; j++) {
			const A = floor[i];
			const B = floor[j];
			const a = ext(A);
			const b = ext(B);
			const ox = a.ex + b.ex - Math.abs(A.position.x - B.position.x);
			const oz = a.ez + b.ez - Math.abs(A.position.z - B.position.z);
			if (ox > 0.02 && oz > 0.02)
				overlaps.push(`${A.id}x${B.id}(${ox.toFixed(2)}x${oz.toFixed(2)})`);
		}
	return { out, objs: [...objs.values()], clamped, overlaps };
}

const jobs = [];
for (const spec of SPECS)
	for (const brief of BRIEFS)
		jobs.push(
			(async () => {
				const [model, level] = spec.split("@");
				const scene = defaultScene();
				const t0 = Date.now();
				try {
					const calls = await runDesigner(
						{ scene, history: [], utterance: brief, brief },
						{ model, thinkingLevel: level, timeoutMs: 180000 },
					);
					const ms = Date.now() - t0;
					const a = analyze(calls, scene);
					return {
						model: spec,
						brief,
						ms,
						ops: a.out.ops.length,
						dropped: a.out.dropped,
						overlaps: a.overlaps,
						clamped: a.clamped,
						say: a.out.say,
						opsList: a.out.ops,
						objects: a.objs,
					};
				} catch (e) {
					return {
						model: spec,
						brief,
						ms: Date.now() - t0,
						error: String(e.message).slice(0, 200),
					};
				}
			})(),
		);
const results = await Promise.all(jobs);

const f = (v) => v.toFixed(2);
for (const r of results) {
	console.log(`\n=== ${r.model} | ${r.brief} | ${(r.ms / 1000).toFixed(1)} s`);
	if (r.error) {
		console.log("  ERROR", r.error);
		continue;
	}
	console.log(
		`  ops ${r.ops}, dropped ${r.dropped.length} ${r.dropped.join("; ")}, overlaps ${r.overlaps.length} ${r.overlaps.join(" ")}, clamped ${r.clamped}`,
	);
	console.log(`  say: ${r.say}`);
	for (const op of r.opsList)
		if (op.op === "surface")
			console.log(`  surface ${op.id} ${JSON.stringify(op.changes)}`);
		else if (op.op === "add_decal")
			console.log(
				`  decal ${op.id} ${op.decal.surface} x${op.decal.x} y${op.decal.y} ${op.decal.width}x${op.decal.height}: ${op.decal.prompt.slice(0, 60)}`,
			);
		else if (op.op !== "add")
			console.log(
				`  ${op.op} ${op.id} ${op.changes ? JSON.stringify(op.changes).slice(0, 120) : ""}`,
			);
	for (const o of r.objects)
		console.log(
			`  obj ${o.id.padEnd(14)} ${o.name.slice(0, 26).padEnd(26)} pos(${f(o.position.x)},${f(o.position.y)},${f(o.position.z)}) size(${f(o.size.x)}x${f(o.size.y)}x${f(o.size.z)}) rot${o.rotation_y_deg} ${o.parent ? "on " + o.parent : ""}`,
		);
}
console.log("\nSUMMARY model | brief | s | ops | dropped | overlaps | clamped");
for (const r of results)
	console.log(
		`${r.model} | ${r.brief} | ${(r.ms / 1000).toFixed(1)} | ${r.error ? "ERR " + r.error.slice(0, 60) : `${r.ops} | ${r.dropped.length} | ${r.overlaps.length} | ${r.clamped}`}`,
	);
fs.mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
fs.writeFileSync(
	new URL(`./out/designer_bench_${Date.now()}.json`, import.meta.url),
	JSON.stringify(results, null, 2),
);
