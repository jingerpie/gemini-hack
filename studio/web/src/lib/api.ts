// Thin client for the studio server (/api/*, proxied by Vite to :8787).
// The TaskManager talks to an `Api`, so `?mock=1` can swap in lib/mockApi.ts.
import type {
  AssetEvent,
  AssetRequest,
  DecalRequest,
  DecalResponse,
  PatchRequest,
  PatchResponse,
  VerifyRequest,
  VerifyResponse,
} from "../types";

export interface Api {
  patch(req: PatchRequest, signal: AbortSignal): Promise<PatchResponse>;
  /** Streams AssetEvents to onEvent; resolves when the stream ends (after done/error or EOF). */
  asset(req: AssetRequest, signal: AbortSignal, onEvent: (e: AssetEvent) => void): Promise<void>;
  decal(req: DecalRequest, signal: AbortSignal): Promise<DecalResponse>;
  verify(req: VerifyRequest, signal?: AbortSignal): Promise<VerifyResponse>;
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
    throw new Error(`${path} ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

/** Reads a POST text/event-stream response. Each event is `data: <json>\n\n` (multi-line data joined by \n). */
async function readSse(res: Response, onData: (data: string) => void): Promise<void> {
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
  patch: (req, signal) => postJson<PatchResponse>("/api/patch", req, signal),
  async asset(req, signal, onEvent) {
    const res = await fetch("/api/asset", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream" },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      throw new Error(`/api/asset ${res.status}${detail ? `: ${detail}` : ""}`);
    }
    await readSse(res, (data) => {
      try {
        onEvent(JSON.parse(data) as AssetEvent);
      } catch {
        /* ignore malformed event */
      }
    });
  },
  decal: (req, signal) => postJson<DecalResponse>("/api/decal", req, signal),
  verify: (req, signal) => postJson<VerifyResponse>("/api/verify", req, signal),
};
