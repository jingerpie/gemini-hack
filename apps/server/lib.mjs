// Shared helpers: API key (never logged), Gemini REST calls, SSE parsing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const BASE = "https://generativelanguage.googleapis.com/v1beta";

// The repo-root .env key wins: a user-level GEMINI_API_KEY env var on this machine belongs to a different
// (prepaid, depleted) project and was the cause of the intermittent 402s. Set GEMINI_KEY_FROM_ENV=1 to prefer the env var.
export let KEY_SOURCE = "";
function loadKey() {
	const envFile = path.join(SERVER_DIR, "..", "..", ".env");
	const fromFile =
		fs.existsSync(envFile) &&
		fs
			.readFileSync(envFile, "utf8")
			.match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)?.[1]
			?.trim();
	const fromEnv = process.env.GEMINI_API_KEY?.trim();
	if (fromEnv && (process.env.GEMINI_KEY_FROM_ENV === "1" || !fromFile)) {
		KEY_SOURCE = "env";
		return fromEnv;
	}
	if (fromFile) {
		KEY_SOURCE = ".env";
		return fromFile;
	}
	throw new Error("GEMINI_API_KEY missing (env or ../../.env)");
}
export const KEY = loadKey();
export const H = { "x-goog-api-key": KEY, "Content-Type": "application/json" };

// Never let the key leak into error text.
export const scrub = (s) => String(s).split(KEY).join("***");

// ---------- resilience: retries with backoff + a small server-wide in-flight limiter ----------
// 402 (prepay flapping), 429, 500, 503 and network resets are retried at 0.8 s, 2 s, 5 s (+ jitter).
// Fast-path callers (priority 'high') jump the limiter queue and stop retrying after RETRY_BUDGET_HIGH_MS.
const RETRY_STATUS = new Set([402, 429, 500, 503]);
const RETRY_DELAYS = [800, 2000, 5000];
const RETRY_BUDGET_HIGH_MS = 9000;
export const MAX_INFLIGHT = +(process.env.GEMINI_MAX_INFLIGHT || 6);
export const stats = {
	retries: {},
	failures: {},
	lastError: null,
	lastErrorAt: null,
	inflight: 0,
	queued: 0,
	maxInflight: MAX_INFLIGHT,
};
const queue = { high: [], normal: [] };
function acquire(priority) {
	if (stats.inflight < MAX_INFLIGHT) {
		stats.inflight++;
		return Promise.resolve();
	}
	stats.queued++;
	return new Promise((res) =>
		queue[priority === "high" ? "high" : "normal"].push(res),
	);
}
function release() {
	const next = queue.high.shift() || queue.normal.shift();
	if (next) {
		stats.queued--;
		next();
	} else stats.inflight--;
}
const jitter = (d) => d + Math.round(Math.random() * d * 0.25);
function noteError(code, msg) {
	stats.lastError = `${code} ${String(msg).slice(0, 120)}`;
	stats.lastErrorAt = new Date().toISOString();
}
const isNetErr = (e) =>
	!e.status &&
	!e.timeout &&
	!e.aborted &&
	/fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket|terminated|UND_ERR/i.test(
		String(e.message) +
			String(e.cause?.code || "") +
			String(e.cause?.message || ""),
	);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run attempt() with retries. attempt() throws errors carrying .status (HTTP) or network errors.
export async function withRetry(
	attempt,
	{ label = "gemini", priority = "normal", signal } = {},
) {
	const t0 = Date.now();
	for (let i = 0; ; i++) {
		try {
			return await attempt();
		} catch (e) {
			const code = e.status || (isNetErr(e) ? "net" : null);
			if (code) noteError(code, e.message);
			const d = RETRY_DELAYS[i] && jitter(RETRY_DELAYS[i]);
			const retriable =
				code &&
				(code === "net" || RETRY_STATUS.has(code)) &&
				d &&
				!signal?.aborted;
			if (
				!retriable ||
				(priority === "high" && Date.now() - t0 + d > RETRY_BUDGET_HIGH_MS)
			) {
				if (code) stats.failures[code] = (stats.failures[code] || 0) + 1;
				throw e;
			}
			stats.retries[code] = (stats.retries[code] || 0) + 1;
			console.log(`retry ${code} ${label} attempt ${i + 2} after ${d}ms`);
			await sleep(d);
		}
	}
}

async function postJsonOnce(url, body, { timeoutMs = 120000, signal } = {}) {
	const ctl = new AbortController();
	let timedOut = false;
	const t = setTimeout(() => {
		timedOut = true;
		ctl.abort(new Error(`timeout after ${timeoutMs} ms`));
	}, timeoutMs);
	const onAbort = () => ctl.abort(signal.reason);
	signal?.addEventListener("abort", onAbort);
	try {
		const r = await fetch(url, {
			method: "POST",
			headers: H,
			body: JSON.stringify(body),
			signal: ctl.signal,
		});
		const txt = await r.text();
		let js;
		try {
			js = JSON.parse(txt);
		} catch {
			js = { raw: txt.slice(0, 500) };
		}
		if (!r.ok) {
			const e = new Error(
				scrub(
					`${r.status} ${js.error?.message || JSON.stringify(js).slice(0, 400)}`,
				),
			);
			e.status = r.status;
			throw e;
		}
		return js;
	} catch (e) {
		if (timedOut) e.timeout = true;
		else if (signal?.aborted) e.aborted = true;
		throw e;
	} finally {
		clearTimeout(t);
		signal?.removeEventListener("abort", onAbort);
	}
}

export async function postJson(url, body, opts = {}) {
	const { label = url.split("/").pop().slice(0, 40), priority = "normal" } =
		opts;
	return withRetry(
		async () => {
			await acquire(priority);
			try {
				return await postJsonOnce(url, body, opts);
			} finally {
				release();
			}
		},
		{ label, priority, signal: opts.signal },
	);
}

export async function generateContent(model, body, opts = {}) {
	return postJson(`${BASE}/models/${model}:generateContent`, body, {
		label: model,
		...opts,
	});
}

// fetch() for streaming endpoints (Managed Agent interactions): retries the initial response status / network
// errors before any stream is consumed. Not counted by the limiter (those streams live for minutes).
export async function fetchRetry(
	url,
	init,
	{ label = "interactions", priority = "normal" } = {},
) {
	return withRetry(
		async () => {
			const r = await fetch(url, init);
			if (RETRY_STATUS.has(r.status)) {
				const txt = await r.text().catch(() => "");
				const e = new Error(scrub(`${r.status} ${txt.slice(0, 300)}`));
				e.status = r.status;
				throw e;
			}
			return r;
		},
		{ label, priority, signal: init?.signal },
	);
}

// Parse an SSE response body into JSON objects.
export async function* sse(res) {
	const dec = new TextDecoder();
	let buf = "";
	for await (const chunk of res.body) {
		buf += dec.decode(chunk, { stream: true });
		let i;
		while ((i = buf.indexOf("\n\n")) >= 0) {
			const block = buf.slice(0, i);
			buf = buf.slice(i + 2);
			const data = block
				.split("\n")
				.filter((l) => l.startsWith("data:"))
				.map((l) => l.slice(5).trim())
				.join("\n");
			if (!data || data === "[DONE]") continue;
			try {
				yield JSON.parse(data);
			} catch {
				/* ignore partial/non-JSON */
			}
		}
	}
}

export const textOf = (js) =>
	(js.candidates?.[0]?.content?.parts || [])
		.filter((p) => p.text && !p.thought)
		.map((p) => p.text)
		.join("");
