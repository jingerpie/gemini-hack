// Characterise the intermittent 402: bursts of 1..4 tiny calls, then the real app mix, then retries of any 402.
// Usage: node apps/server/test/probe402.mjs [--burst6]   (prints status/timing; full body + headers of any non-200; never the key)
import { BASE, H, scrub } from "../lib.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t00 = Date.now();
const failures = [];

async function raw(label, url, body, { stream = false } = {}) {
	const t0 = Date.now();
	try {
		const r = await fetch(url, {
			method: "POST",
			headers: H,
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(90000),
		});
		let txt = "";
		if (stream && r.ok) {
			// read only until the first event, then cancel the interaction
			const reader = r.body.getReader();
			const dec = new TextDecoder();
			let id = null;
			for (let i = 0; i < 40 && !id; i++) {
				const { value, done } = await reader.read();
				if (done) break;
				txt += dec.decode(value, { stream: true });
				id = /"id"\s*:\s*"([^"]+)"/.exec(txt)?.[1];
			}
			reader.cancel().catch(() => {});
			if (id)
				fetch(`${BASE}/interactions/${id}/cancel`, {
					method: "POST",
					headers: H,
				})
					.then((x) => x.text())
					.catch(() => {});
		} else txt = await r.text();
		const ms = Date.now() - t0;
		const line = `${label.padEnd(22)} ${r.status} ${String(ms).padStart(6)}ms  t+${((t0 - t00) / 1000).toFixed(1)}s`;
		console.log(line);
		if (!r.ok) {
			const hdr = {};
			r.headers.forEach((v, k) => {
				hdr[k] = v;
			});
			failures.push({ label, url, body, status: r.status });
			console.log("   BODY", scrub(txt).slice(0, 1500));
			console.log("   HEADERS", JSON.stringify(hdr));
		}
		return r.status;
	} catch (e) {
		console.log(
			`${label.padEnd(22)} NETERR ${Date.now() - t0}ms ${scrub(e.message)}`,
		);
		return 0;
	}
}
const gen = (model) => `${BASE}/models/${model}:generateContent`;
const tiny = (i) => ({
	contents: [
		{ role: "user", parts: [{ text: `Reply with the single word ok${i}.` }] },
	],
	generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
});

for (const n of [1, 2, 3, 4]) {
	console.log(`\n--- burst of ${n} x hydrogen`);
	await Promise.all(
		Array.from({ length: n }, (_, i) =>
			raw(`hyd ${n}.${i + 1}`, gen("gemini-4-hydrogen"), tiny(i)),
		),
	);
	await sleep(3000);
}
if (process.argv.includes("--burst6")) {
	console.log("\n--- burst of 6 x hydrogen");
	await Promise.all(
		Array.from({ length: 6 }, (_, i) =>
			raw(`hyd 6.${i + 1}`, gen("gemini-4-hydrogen"), tiny(i)),
		),
	);
	await sleep(3000);
}
console.log("\n--- app mix: patch + codegen + image + managed agent, together");
await Promise.all([
	raw("mix patch (hyd)", gen("gemini-4-hydrogen"), tiny(9)),
	raw("mix codegen (hyd)", gen("gemini-4-hydrogen"), {
		contents: [
			{
				role: "user",
				parts: [
					{
						text: "Write a JavaScript function build(THREE) that returns a THREE.Group with a box seat and four cylinder legs (a stool). Code only.",
					},
				],
			},
		],
		generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
	}),
	raw("mix image (banana)", gen("gemini-nano-banana-2.1"), {
		contents: [
			{
				role: "user",
				parts: [
					{ text: "A flat front-on vector graphic of a red circle on white." },
				],
			},
		],
		generationConfig: {
			responseModalities: ["IMAGE"],
			imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
			thinkingConfig: { thinkingLevel: "minimal" },
		},
	}),
	raw(
		"mix agent (interact)",
		`${BASE}/interactions`,
		{
			agent: "antigravity-preview-09-2026",
			input: "Reply with the word ok. Do nothing else.",
			environment: "remote",
			stream: true,
		},
		{ stream: true },
	),
]);

if (failures.length) {
	const f = failures[0];
	console.log(`\n--- retrying first failure (${f.label}) after 1 s, 3 s, 8 s`);
	for (const d of [1000, 3000, 8000]) {
		await sleep(d);
		await raw(`retry +${d / 1000}s ${f.label}`, f.url, f.body);
	}
}
console.log(`\n${failures.length} non-200 of the run`);
