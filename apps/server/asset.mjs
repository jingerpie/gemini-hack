// POST /api/asset: build a three.js model as code.
// Primary: Gemini Managed Agent (antigravity) writes /workspace/model.js and validates it in its sandbox
// by running /workspace/check.mjs (syntax + executes build() against a strict THREE stub).
// Hedge: if the agent has no valid code after HEDGE_MS (or fails), a direct gemini-4-hydrogen call races it.
// Every result is validated server-side by executing build() with the real three.js in a vm with a timeout.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
	BASE,
	fetchRetry,
	generateContent,
	H,
	SERVER_DIR,
	scrub,
	sse,
	textOf,
} from "./lib.mjs";

export const AGENT = process.env.ASSET_AGENT || "antigravity-preview-09-2026";
export const DIRECT_MODEL =
	process.env.ASSET_DIRECT_MODEL || "gemini-4-hydrogen";
const AGENT_MODEL = process.env.ASSET_AGENT_MODEL || ""; // '' = agent default (gemini-4-hydrogen)
const HEDGE_MS = +(process.env.ASSET_HEDGE_MS || 35000); // start direct model in parallel if agent has nothing yet
const AGENT_TIMEOUT_MS = +(process.env.ASSET_AGENT_TIMEOUT_MS || 75000);
const TOTAL_TIMEOUT_MS = +(process.env.ASSET_TOTAL_TIMEOUT_MS || 150000);
const USE_ENV_POOL = process.env.ASSET_ENV_POOL !== "0";
const SYSTEM = fs.readFileSync(
	path.join(SERVER_DIR, "prompts", "codegen.txt"),
	"utf8",
);

// ---------- real three.js for server-side validation ----------
let THREE = null;
try {
	THREE = await import("three");
} catch {
	console.warn(
		"[asset] three not importable; server-side validation limited to parsing",
	);
}
const THREE_NAMES = THREE
	? Object.keys(THREE).filter((k) => /^[A-Z]/.test(k))
	: [];

// ---------- sandbox check script (mounted into the agent's environment) ----------
const CHECK_JS = `// Validates /workspace/model.js: syntax, defines build(THREE), runs it against a strict THREE stub.
import fs from 'node:fs';
const file = process.argv[2] || '/workspace/model.js';
const NAMES = new Set(${JSON.stringify(THREE_NAMES)});
let meshes = 0;
function mk(p) {
  const store = Object.create(null);
  return new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 1;
      if (k === Symbol.iterator) return function* () {};
      if (typeof k === 'symbol' || k === 'then') return undefined;
      if (k === 'prototype') return t.prototype;
      if (!(k in store)) store[k] = mk(p + '.' + String(k));
      return store[k];
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return mk(p + '()'); },
    construct() { if (p === 'THREE.Mesh') meshes++; return mk('new ' + p); },
  });
}
const THREE = new Proxy({}, { get(t, k) {
  if (typeof k === 'symbol') return undefined;
  if (NAMES.size && !NAMES.has(k)) throw new Error('THREE.' + k + ' does not exist in three.js r170');
  return mk('THREE.' + k);
} });
const fail = m => { console.log('CHECK FAILED: ' + m); process.exit(1); };
let src; try { src = fs.readFileSync(file, 'utf8'); } catch (e) { fail('cannot read ' + file); }
if (/^\\s*(import|export)\\b/m.test(src)) fail('remove import/export statements; define a plain function build(THREE)');
let build;
try { build = new Function('"use strict";\\n' + src + '\\n;return typeof build === "function" ? build : undefined;')(); }
catch (e) { fail('syntax/load error: ' + e.message); }
if (!build) fail('no function named build');
let g; try { g = build(THREE); } catch (e) { fail('build(THREE) threw: ' + e.message); }
if (!g) fail('build(THREE) returned nothing');
if (meshes < 3) fail('only ' + meshes + ' meshes created; build a detailed model');
console.log('CHECK OK: ' + meshes + ' meshes');
`;

// ---------- code cleanup + validation ----------
export function cleanCode(text) {
	let s = String(text || "");
	const fence = [
		...s.matchAll(/```(?:javascript|js|mjs)?[^\n]*\n([\s\S]*?)```/g),
	].map((m) => m[1]);
	if (fence.length)
		s = fence.find((f) => /function\s+build\s*\(/.test(f)) || fence[0];
	s = s
		.replace(/^\s*import\s[^\n]*$/gm, "")
		.replace(/^\s*export\s+default\s+build\s*;?\s*$/gm, "")
		.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
		.replace(/^(\s*)export\s+default\s+(?=function|async|class)/gm, "$1")
		.replace(/^(\s*)export\s+(?=function|const|let|var|class|async)/gm, "$1")
		.replace(/^\s*module\.exports[^\n]*$/gm, "");
	return s.trim() + "\n";
}

export function validateCode(code) {
	if (!/function\s+build\s*\(/.test(code))
		return { ok: false, error: "no `function build(` in code" };
	try {
		new Function(code);
	} catch (e) {
		return { ok: false, error: "parse error: " + e.message };
	}
	if (!THREE) return { ok: true, meshes: null };
	try {
		const ctx = vm.createContext({ THREE });
		new vm.Script(
			`"use strict";\n${code}\n;globalThis.__out = build(THREE);`,
		).runInContext(ctx, { timeout: 3000 });
		const g = ctx.__out;
		if (!g || !g.isObject3D)
			return {
				ok: false,
				error: "build(THREE) did not return a THREE.Object3D/Group",
			};
		let meshes = 0;
		g.traverse((o) => {
			if (o.isMesh) meshes++;
		});
		if (!meshes) return { ok: false, error: "model has no meshes" };
		const b = new THREE.Box3().setFromObject(g);
		const sz = b.getSize(new THREE.Vector3());
		if (![sz.x, sz.y, sz.z].every(Number.isFinite) || sz.length() === 0)
			return { ok: false, error: "model bounding box is empty/NaN" };
		return {
			ok: true,
			meshes,
			bbox: { x: +sz.x.toFixed(2), y: +sz.y.toFixed(2), z: +sz.z.toFixed(2) },
		};
	} catch (e) {
		return {
			ok: false,
			error: "build(THREE) threw: " + String(e.message || e).slice(0, 300),
		};
	}
}

function taskText({ name, description, size, currentCode }) {
	const sz = `${(+size?.x || 1).toFixed(2)} m wide (x) x ${(+size?.y || 1).toFixed(2)} m tall (y) x ${(+size?.z || 1).toFixed(2)} m deep (z)`;
	let t = `Object: ${name || "object"}\nDescription: ${description || name}\nTarget size: ${sz}.`;
	if (currentCode)
		t += `\n\nThis is an EDIT of an existing model. Keep everything that still fits the new description (structure, proportions, orientation) and change what the description asks for. Existing code:\n\`\`\`javascript\n${String(currentCode).slice(0, 30000)}\n\`\`\``;
	return t;
}

// ---------- direct model path ----------
async function directBuild(req, { signal, onStatus }) {
	const t0 = Date.now();
	let prompt =
		taskText(req) +
		"\n\nRespond with only the code in a single ```javascript block, no explanation.";
	for (let attempt = 1; attempt <= 2; attempt++) {
		onStatus(
			attempt === 1
				? `direct ${DIRECT_MODEL}: generating code`
				: `direct ${DIRECT_MODEL}: fixing (${attempt})`,
		);
		const js = await generateContent(
			DIRECT_MODEL,
			{
				systemInstruction: { parts: [{ text: SYSTEM }] },
				contents: [{ role: "user", parts: [{ text: prompt }] }],
				generationConfig: {
					thinkingConfig: { thinkingLevel: "low" },
					maxOutputTokens: 32768,
				},
			},
			{ timeoutMs: 90000, signal },
		);
		const code = cleanCode(textOf(js));
		const v = validateCode(code);
		if (v.ok)
			return {
				code,
				v,
				ms: Date.now() - t0,
				via: "direct",
				model: DIRECT_MODEL,
			};
		onStatus(`direct output invalid: ${v.error.slice(0, 120)}`);
		prompt =
			taskText(req) +
			`\n\nA previous attempt failed validation with: ${v.error}\nPrevious code:\n\`\`\`javascript\n${code.slice(0, 20000)}\n\`\`\`\nReturn the corrected complete code only, in a single \`\`\`javascript block.`;
	}
	throw new Error("direct model produced invalid code twice");
}

// ---------- managed agent path ----------
const envPool = []; // warm sandboxes not currently in use: { id, at }
const ENV_TTL_MS = 10 * 60 * 1000;
function takeEnv() {
	while (envPool.length) {
		const e = envPool.pop();
		if (Date.now() - e.at < ENV_TTL_MS) return e.id;
	}
	return null;
}
function returnEnv(id) {
	if (
		USE_ENV_POOL &&
		id &&
		envPool.length < 6 &&
		!envPool.some((e) => e.id === id)
	)
		envPool.push({ id, at: Date.now() });
}

const AGENT_INSTRUCTIONS = `${SYSTEM}
You are working in a sandbox. Steps:
1. Use write_to_file to write the complete function to /workspace/model.js (only the function, no imports/exports, no markdown).
2. Run: node /workspace/check.mjs /workspace/model.js
   It syntax-checks the file and executes build() against a strict THREE stub (unknown THREE classes throw).
3. If it prints CHECK FAILED, fix the problem by rewriting the WHOLE file with write_to_file, then re-run the check. Repeat until it prints CHECK OK.
4. As soon as it prints CHECK OK, you are done: finish with one short sentence. Do not paste the code in your reply.
Before writing, double-check in your head: front faces +Z, origin bottom-center on the floor, real size, at rest.
Be fast: plan briefly in your head and write the file right away; no other exploration, no listing files, no npm install.`;

async function agentBuild(
	req,
	{ signal, onStatus, onInteraction, onCode, agentModel },
) {
	const t0 = Date.now();
	const model = agentModel || AGENT_MODEL;
	const warm = USE_ENV_POOL ? takeEnv() : null;
	const input = `${AGENT_INSTRUCTIONS}\n\n${taskText(req)}`;
	const environment = warm || {
		type: "remote",
		sources: [
			{ type: "inline", target: "/workspace/check.mjs", content: CHECK_JS },
		],
	};
	onStatus(
		warm
			? "managed agent: reusing warm sandbox"
			: "managed agent: starting sandbox",
	);
	let envId = warm;
	let interactionId = null;
	let status = null;
	let finalText = "";
	// Heartbeat: the agent can think silently for ~30 s while it writes the model; keep the UI alive.
	let lastStatusAt = Date.now();
	const rawStatus = onStatus;
	onStatus = (text) => {
		lastStatusAt = Date.now();
		rawStatus(text);
	};
	const hb = setInterval(() => {
		if (Date.now() - lastStatusAt > 5000)
			onStatus(
				`managed agent: designing the model (${Math.round((Date.now() - t0) / 1000)}s)`,
			);
	}, 1000);
	try {
		const res = await fetchRetry(`${BASE}/interactions`, {
			method: "POST",
			headers: H,
			signal,
			body: JSON.stringify({
				agent: AGENT,
				input,
				environment,
				stream: true,
				...(model && { agent_config: { type: "antigravity", model } }),
			}),
		});
		if (!res.ok)
			throw new Error(
				scrub(`agent HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`),
			);
		const steps = {};
		let lastFile = null;
		let fileTouchedOtherwise = false;
		let checkOk = false;
		let earlyExit = false;
		for await (const ev of sse(res)) {
			const et = ev.event_type;
			if (et === "interaction.created") {
				interactionId = ev.interaction?.id;
				envId = ev.interaction?.environment_id || envId;
				onInteraction?.(interactionId);
			} else if (et === "step.start") {
				const s = (steps[ev.index] = { ...ev.step, _args: "", _thought: "" });
				if (
					s.type === "function_call" &&
					s.name &&
					s.name !== "write_to_file"
				) {
					if (JSON.stringify(s.arguments || {}).includes("model.js"))
						fileTouchedOtherwise = true;
					onStatus(`agent tool: ${s.name}`);
				}
				if (s.type === "function_call" && s.name === "write_to_file")
					onStatus("agent: writing model.js");
				if (s.type === "code_execution_call") {
					const code = String(s.arguments?.code || "").trim();
					onStatus(
						/check\.mjs/.test(code)
							? "agent: running node check.mjs in sandbox"
							: `agent: running ${code.slice(0, 60)}`,
					);
				}
				if (s.type === "code_execution_result") {
					const r = String(s.result || "");
					const m = r.match(/CHECK (OK|FAILED)[^\n]*/);
					if (m) {
						onStatus("sandbox: " + m[0].slice(0, 140));
						checkOk = m[1] === "OK";
					} else if (s.is_error) onStatus("sandbox: command failed");
					// Early exit: the sandbox check passed on the file we captured -> don't wait for the agent's wrap-up.
					if (checkOk && lastFile && !fileTouchedOtherwise) {
						earlyExit = true;
						break;
					}
				}
				if (s.type === "function_result" && s.is_error)
					onStatus(`agent tool error: ${String(s.result || "").slice(0, 100)}`);
			} else if (et === "step.delta") {
				const s = steps[ev.index];
				const d = ev.delta || {};
				if (!s) continue;
				if (d.type === "arguments_delta") {
					s._args += d.arguments;
					if (
						s.name === "write_to_file" &&
						Date.now() - (s._lastNote || 0) > 2500
					) {
						s._lastNote = Date.now();
						const parts = (s._args.match(/\.name\s*=|name:\s*'/g) || []).length;
						onStatus(
							`agent: writing model.js (${(s._args.length / 1000).toFixed(1)}k chars${parts ? `, ${parts} named parts` : ""})`,
						);
					}
				}
				if (d.type === "text") finalText += d.text;
				if (d.type === "thought_summary") {
					const txt = d.content?.text || d.text || "";
					if (!s._thought) {
						const h = txt.match(/\*\*([^*]{3,80})\*\*/);
						if (h) onStatus(h[1].trim());
					}
					s._thought += txt;
				}
			} else if (et === "step.stop") {
				const s = steps[ev.index];
				if (s?._args) {
					try {
						s.arguments = JSON.parse(s._args);
					} catch {}
				}
				if (s?.type === "function_call" && s.name === "write_to_file") {
					const a = s.arguments || {};
					if (
						/model\.js$/.test(String(a.TargetFile || "")) &&
						typeof a.CodeContent === "string"
					) {
						lastFile = a.CodeContent;
						fileTouchedOtherwise = false;
						onCode?.();
					}
				}
			} else if (et === "interaction.completed") {
				status = ev.interaction?.status;
				envId = ev.interaction?.environment_id || envId;
			} else if (et === "error") {
				throw new Error(
					"agent stream error: " +
						scrub(JSON.stringify(ev.error || ev).slice(0, 300)),
				);
			}
		}
		let cancelled = null;
		if (earlyExit)
			cancelled = cancelInteraction(interactionId); // stop the agent's wrap-up turn
		else if (status && status !== "completed")
			throw new Error(`agent finished with status ${status}`);
		// Authoritative copy if the agent edited the file with something other than write_to_file.
		let code = lastFile;
		if ((!code || fileTouchedOtherwise) && envId) {
			try {
				const r = await fetch(
					`${BASE}/environments/${envId}/files/workspace/model.js?alt=media`,
					{ headers: H, signal: AbortSignal.timeout(8000) },
				);
				if (r.ok) code = await r.text();
			} catch {}
		}
		if (!code && /function\s+build/.test(finalText)) code = finalText;
		if (!code) throw new Error("agent produced no model.js");
		code = cleanCode(code);
		const v = validateCode(code);
		if (!v.ok)
			throw new Error("agent code failed server validation: " + v.error);
		if (!checkOk)
			onStatus("note: agent did not report CHECK OK; server validation passed");
		if (cancelled) cancelled.then(() => returnEnv(envId));
		else returnEnv(envId);
		return {
			code,
			v,
			ms: Date.now() - t0,
			via: "managed-agent",
			model: model ? `${AGENT} (${model})` : AGENT,
			warm: !!warm,
		};
	} catch (e) {
		if (warm && !interactionId && !signal?.aborted) {
			// Stale warm sandbox: retry once with a fresh one.
			onStatus("warm sandbox unavailable, starting fresh");
			clearInterval(hb);
			return agentBuild(req, {
				signal,
				onStatus: rawStatus,
				onInteraction,
				onCode,
				agentModel,
			});
		}
		throw e;
	} finally {
		clearInterval(hb);
	}
}

function cancelInteraction(id) {
	if (!id) return Promise.resolve();
	return fetch(`${BASE}/interactions/${id}/cancel`, {
		method: "POST",
		headers: H,
	})
		.then((r) => r.text())
		.catch(() => {});
}

// ---------- orchestration ----------
// mode: 'race' (default: agent, hedged by direct), 'agent' (agent only), 'direct' (direct only)
export async function buildAsset(
	req,
	{ send, mode = "race", signal: outer, agentModel },
) {
	const t0 = Date.now();
	const status = (text) =>
		send({ type: "status", text: String(text).slice(0, 160) });
	return new Promise((resolve) => {
		let done = false;
		let pending = 0;
		let directStarted = false;
		let agentInteraction = null;
		let agentHasCode = false;
		const agentCtl = new AbortController();
		const directCtl = new AbortController();
		const errors = [];
		const timers = [];
		const finish = (ev) => {
			if (done) return;
			done = true;
			timers.forEach(clearTimeout);
			agentCtl.abort(new Error("superseded"));
			directCtl.abort(new Error("superseded"));
			if (ev.type === "done" && ev.via !== "managed-agent")
				cancelInteraction(agentInteraction);
			send(ev);
			resolve(ev);
		};
		outer?.addEventListener("abort", () => {
			if (!done) {
				done = true;
				timers.forEach(clearTimeout);
				agentCtl.abort();
				directCtl.abort();
				cancelInteraction(agentInteraction);
				resolve(null);
			}
		});
		const settle = (label, p) => {
			pending++;
			p.then((r) => {
				status(
					`${label} done in ${(r.ms / 1000).toFixed(1)}s: ${r.v.meshes ?? "?"} meshes${r.v.bbox ? `, bbox ${r.v.bbox.x}x${r.v.bbox.y}x${r.v.bbox.z} m` : ""}`,
				);
				finish({
					type: "done",
					code: r.code,
					ms: Date.now() - t0,
					via: r.via,
					model: r.model,
				});
			})
				.catch((e) => {
					if (done) return;
					const msg = scrub(String(e?.message || e)).slice(0, 300);
					errors.push(`${label}: ${msg}`);
					status(`${label} failed: ${msg.slice(0, 120)}`);
				})
				.finally(() => {
					pending--;
					if (done) return;
					if (label === "agent" && mode === "race" && !directStarted)
						return startDirect("agent failed");
					if (pending === 0)
						finish({
							type: "error",
							message: errors.join(" | ") || "asset build failed",
						});
				});
		};
		const startDirect = (why) => {
			if (done || directStarted || mode === "agent") return;
			directStarted = true;
			if (why) status(`starting direct model (${why})`);
			settle(
				"direct",
				directBuild(req, { signal: directCtl.signal, onStatus: status }),
			);
		};
		if (mode === "direct") {
			startDirect();
		} else {
			settle(
				"agent",
				agentBuild(req, {
					signal: agentCtl.signal,
					onStatus: status,
					agentModel,
					onInteraction: (id) => {
						agentInteraction = id;
					},
					onCode: () => {
						agentHasCode = true;
					},
				}),
			);
			timers.push(
				setTimeout(() => {
					if (done) return;
					status(`managed agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`);
					agentCtl.abort(new Error("agent timeout"));
					cancelInteraction(agentInteraction);
				}, AGENT_TIMEOUT_MS),
			);
			if (mode === "race") {
				// Hedge only if the agent has not written its model yet (if it has, it is just running the sandbox check).
				const hedge = () => {
					if (done || directStarted) return;
					if (agentHasCode && Date.now() - t0 < AGENT_TIMEOUT_MS - 10000)
						return timers.push(setTimeout(hedge, 5000));
					startDirect(
						`agent still working after ${Math.round((Date.now() - t0) / 1000)}s, hedging`,
					);
				};
				timers.push(setTimeout(hedge, HEDGE_MS));
			}
		}
		timers.push(
			setTimeout(
				() =>
					finish({
						type: "error",
						message: `asset build timed out after ${TOTAL_TIMEOUT_MS / 1000}s; ${errors.join(" | ")}`,
					}),
				TOTAL_TIMEOUT_MS,
			),
		);
	});
}

export const assetConfig = {
	AGENT,
	DIRECT_MODEL,
	HEDGE_MS,
	AGENT_TIMEOUT_MS,
	USE_ENV_POOL,
	threeLoaded: !!THREE,
	threeNames: THREE_NAMES.length,
};
