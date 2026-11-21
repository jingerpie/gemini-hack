// Thin client for the studio server (/api/*, proxied by Vite to :8787).
// The TaskManager talks to an `Api`, so `?mock=1` can swap in lib/mockApi.ts.
import type {
	AssetEvent,
	AssetRequest,
	CheckoutRequest,
	CheckoutResponse,
	ChooseRequest,
	ChooseResponse,
	DecalRequest,
	DecalResponse,
	OptionsResponse,
	PatchRequest,
	PatchResponse,
	RenderRequest,
	RenderResponse,
	SourceEvent,
	SourceRequest,
	VerifyRequest,
	VerifyResponse,
} from "../types";

export interface Api {
	patch(req: PatchRequest, signal: AbortSignal): Promise<PatchResponse>;
	/** Streams AssetEvents to onEvent; resolves when the stream ends (after done/error or EOF). */
	asset(
		req: AssetRequest,
		signal: AbortSignal,
		onEvent: (e: AssetEvent) => void,
	): Promise<void>;
	decal(req: DecalRequest, signal: AbortSignal): Promise<DecalResponse>;
	verify(req: VerifyRequest, signal?: AbortSignal): Promise<VerifyResponse>;
	/** "Shop the look": streams SourceEvents; resolves when the stream ends. Optional (older mocks lack it). */
	source?(
		req: SourceRequest,
		signal: AbortSignal,
		onEvent: (e: SourceEvent) => void,
	): Promise<void>;
	/** Photoreal render of a canvas screenshot. Optional (mocks may lack it). */
	render?(req: RenderRequest, signal: AbortSignal): Promise<RenderResponse>;
	/** Next page of option cards (live search). A missing route throws NotAvailableError. */
	options?(
		q: string,
		page: number,
		objectId: string,
		signal?: AbortSignal,
	): Promise<OptionsResponse>;
	/** Ops + jobs that put the chosen product on the object (no model call). */
	choose?(req: ChooseRequest, signal?: AbortSignal): Promise<ChooseResponse>;
	/** Real checkout links, one per merchant. */
	checkout?(
		req: CheckoutRequest,
		signal?: AbortSignal,
	): Promise<CheckoutResponse>;
}

/** The server does not have this route (404/405): the feature hides itself quietly. */
export class NotAvailableError extends Error {
	constructor(path: string) {
		super(`${path} not available`);
		this.name = "NotAvailableError";
	}
}

const PARAMS = new URLSearchParams(
	typeof location !== "undefined" ? location.search : "",
);
/** ?via=direct|agent|race is passed straight through to /api/asset (server default: race). */
const VIA = ["direct", "agent", "race"].includes(PARAMS.get("via") ?? "")
	? PARAMS.get("via")
	: null;
// The "designer" path inside /api/patch can take ~30 s for whole-room requests.
export const PATCH_TIMEOUT_MS = 45000;
export const RENDER_TIMEOUT_MS = 50000;

/** Server unreachable / restarting (fetch TypeError, or the Vite proxy's 50x with no body). Worth one retry. */
function isConnectionError(err: unknown): boolean {
	if (err instanceof TypeError) return true;
	const m = err instanceof Error ? err.message : "";
	return /^\/api\/\w+ (502|503|504)\b/.test(m) || /^\/api\/\w+ 500$/.test(m);
}
const wait = (ms: number, signal: AbortSignal) =>
	new Promise<void>((resolve) => {
		const id = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => (clearTimeout(id), resolve()), {
			once: true,
		});
	});

/** Aborts when `outer` aborts or after `ms`; the timeout aborts with a readable reason. */
function withTimeout(
	outer: AbortSignal,
	ms: number,
): { signal: AbortSignal; timedOut: () => boolean; clear: () => void } {
	const ctl = new AbortController();
	let timedOut = false;
	const onAbort = () => ctl.abort();
	if (outer.aborted) ctl.abort();
	else outer.addEventListener("abort", onAbort, { once: true });
	const id = setTimeout(() => {
		timedOut = true;
		ctl.abort();
	}, ms);
	return {
		signal: ctl.signal,
		timedOut: () => timedOut,
		clear: () => {
			clearTimeout(id);
			outer.removeEventListener("abort", onAbort);
		},
	};
}

async function postSse<T>(
	path: string,
	body: unknown,
	signal: AbortSignal,
	onEvent: (e: T) => void,
): Promise<void> {
	const res = await fetch(path, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "text/event-stream",
		},
		body: JSON.stringify(body),
		signal,
	});
	if (!res.ok) {
		let detail = "";
		try {
			detail = (await res.text()).slice(0, 300);
		} catch {
			/* ignore */
		}
		throw new Error(
			`${path.split("?")[0]} ${res.status}${detail ? `: ${detail}` : ""}`,
		);
	}
	await readSse(res, (data) => {
		try {
			onEvent(JSON.parse(data) as T);
		} catch {
			/* ignore malformed event */
		}
	});
}

async function postJson<T>(
	path: string,
	body: unknown,
	signal?: AbortSignal,
): Promise<T> {
	const res = await fetch(path, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});
	if (!res.ok) {
		if (res.status === 404 || res.status === 405)
			throw new NotAvailableError(path);
		let detail = "";
		try {
			detail = (await res.text()).slice(0, 300);
		} catch {
			/* ignore */
		}
		throw new Error(`${path} ${res.status}${detail ? `: ${detail}` : ""}`);
	}
	return (await res.json()) as T;
}

export async function getJson<T>(
	path: string,
	signal?: AbortSignal,
): Promise<T> {
	const res = await fetch(path, { signal });
	if (!res.ok) {
		if (res.status === 404 || res.status === 405)
			throw new NotAvailableError(path.split("?")[0]);
		let detail = "";
		try {
			detail = (await res.text()).slice(0, 300);
		} catch {
			/* ignore */
		}
		throw new Error(
			`${path.split("?")[0]} ${res.status}${detail ? `: ${detail}` : ""}`,
		);
	}
	return (await res.json()) as T;
}

/** Reads a POST text/event-stream response. Each event is `data: <json>\n\n` (multi-line data joined by \n). */
async function readSse(
	res: Response,
	onData: (data: string) => void,
): Promise<void> {
	if (!res.body) throw new Error("no response body");
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = "";
	const flushBlock = (block: string) => {
		const lines = block.split(/\r?\n/);
		const data: string[] = [];
		for (const line of lines) {
			if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
		}
		if (data.length) onData(data.join("\n"));
	};
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		buf += decoder.decode(value, { stream: true });
		let idx: number;
		while ((idx = buf.search(/\r?\n\r?\n/)) >= 0) {
			const block = buf.slice(0, idx);
			const sep = buf.slice(idx).match(/^\r?\n\r?\n/)![0];
			buf = buf.slice(idx + sep.length);
			flushBlock(block);
		}
	}
	buf += decoder.decode();
	if (buf.trim()) flushBlock(buf);
}

export const httpApi: Api = {
	async patch(req, signal) {
		const t = withTimeout(signal, PATCH_TIMEOUT_MS);
		try {
			try {
				return await postJson<PatchResponse>("/api/patch", req, t.signal);
			} catch (err) {
				// the server may be restarting (~2 s): retry once
				if (t.signal.aborted || !isConnectionError(err)) throw err;
				console.warn(
					"[studio] /api/patch connection error, retrying once",
					err,
				);
				await wait(1500, t.signal);
				if (t.signal.aborted) throw err;
				return await postJson<PatchResponse>("/api/patch", req, t.signal);
			}
		} catch (err) {
			if (err instanceof TypeError && !t.timedOut() && !signal.aborted)
				throw new Error("server unreachable (is :8787 running?)");
			if (t.timedOut() && !signal.aborted)
				throw new Error(
					`orchestrator timed out after ${PATCH_TIMEOUT_MS / 1000} s`,
				);
			throw err;
		} finally {
			t.clear();
		}
	},
	// catalog models never go to the agent / race: always the plain call (the server answers in well under a second)
	asset: (req, signal, onEvent) =>
		postSse<AssetEvent>(
			`/api/asset${VIA && !req.catalogId ? `?via=${VIA}` : ""}`,
			req,
			signal,
			onEvent,
		),
	source: (req, signal, onEvent) =>
		postSse<SourceEvent>(
			`/api/source${VIA ? `?via=${VIA}` : ""}`,
			req,
			signal,
			onEvent,
		),
	decal: (req, signal) => postJson<DecalResponse>("/api/decal", req, signal),
	verify: (req, signal) => postJson<VerifyResponse>("/api/verify", req, signal),
	options: (q, page, objectId, signal) =>
		getJson<OptionsResponse>(
			`/api/options?q=${encodeURIComponent(q)}&page=${page}&objectId=${encodeURIComponent(objectId)}`,
			signal,
		),
	choose: (req, signal) => postJson<ChooseResponse>("/api/choose", req, signal),
	checkout: (req, signal) =>
		postJson<CheckoutResponse>("/api/checkout", req, signal),
	async render(req, signal) {
		const t = withTimeout(signal, RENDER_TIMEOUT_MS);
		try {
			return await postJson<RenderResponse>("/api/render", req, t.signal);
		} catch (err) {
			if (t.timedOut() && !signal.aborted)
				throw new Error(`render timed out after ${RENDER_TIMEOUT_MS / 1000} s`);
			if (err instanceof TypeError && !signal.aborted)
				throw new Error("server unreachable (is :8787 running?)");
			throw err;
		} finally {
			t.clear();
		}
	},
};
