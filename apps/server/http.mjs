// HTTP helpers shared by the route modules: errors with a status, JSON bodies, request notes, SSE streams.
import { streamSSE } from "hono/streaming";
import { scrub } from "./lib.mjs";

/** An Error that app.onError answers with this status instead of 500. */
export function httpError(status, message) {
	const e = new Error(message);
	e.status = status;
	return e;
}

/** Request body as JSON; {} when empty, 400 when not JSON. Size is capped by the bodyLimit middleware. */
export async function readJson(c) {
	const text = await c.req.text();
	if (!text) return {};
	try {
		return JSON.parse(text);
	} catch {
		throw httpError(400, "invalid JSON body");
	}
}

/** Text appended to this request's log line. */
export const note = (c, s) => c.get("note")(s);

/**
 * Answer with a Server-Sent Events stream. run({ send, signal }) does the work; send(ev) writes one
 * `data:` event, and signal aborts when the client disconnects. A comment ping every 10 s keeps proxies open.
 * The request's log line is printed when the stream ends, not when the headers go out.
 */
export function sse(c, run) {
	c.set("streaming", true);
	c.header("X-Accel-Buffering", "no");
	return streamSSE(c, async (stream) => {
		const ctl = new AbortController();
		stream.onAbort(() => ctl.abort(new Error("client disconnected")));
		// Writes are chained so they keep their order and all land before the stream closes.
		let pending = Promise.resolve();
		const write = (fn) => {
			pending = pending
				.then(() => (stream.aborted || stream.closed ? undefined : fn()))
				.catch(() => {});
		};
		const send = (ev) =>
			write(() => stream.writeSSE({ data: JSON.stringify(ev) }));
		const ping = setInterval(
			() => write(() => stream.write(": ping\n\n")),
			10000,
		);
		try {
			await run({ send, signal: ctl.signal });
		} catch (e) {
			send({ type: "error", message: scrub(e.message || e) });
		} finally {
			clearInterval(ping);
			await pending;
			c.get("logLine")();
		}
	});
}
