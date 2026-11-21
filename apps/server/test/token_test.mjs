// Mints a token via /api/token and opens a gemini-3.5-transcribe-live session with it, like the browser will.
import { GoogleGenAI, Modality } from "@google/genai";

const BASE = process.env.BASE || "http://localhost:8787";
const t0 = Date.now();
const r = await fetch(`${BASE}/api/token`);
const tok = await r.json();
if (!r.ok) {
	console.log("token HTTP", r.status, tok);
	process.exit(1);
}
console.log(
	`token minted in ${Date.now() - t0} ms; model=${tok.model} apiVersion=${tok.apiVersion} prefix=${tok.token.slice(0, 12)}...`,
);
const ai = new GoogleGenAI({
	apiKey: tok.token,
	httpOptions: { apiVersion: tok.apiVersion },
});
const t1 = Date.now();
let setup = false;
let closed = null;
let msgs = 0;
const session = await ai.live.connect({
	model: tok.model,
	config: {
		responseModalities: [Modality.TEXT],
		inputAudioTranscription: { languageCodes: ["en-US"] },
	},
	callbacks: {
		onmessage: (m) => {
			msgs++;
			if (m.setupComplete && !setup) {
				setup = true;
				console.log(`setupComplete after ${Date.now() - t1} ms`);
			}
		},
		onerror: (e) => console.log("error", e?.message || e),
		onclose: (e) => {
			closed = { code: e?.code, reason: e?.reason };
		},
	},
});
for (let i = 0; i < 50 && !setup && !closed; i++)
	await new Promise((r) => setTimeout(r, 100));
// one second of silence to prove the session accepts audio
session.sendRealtimeInput({
	audio: {
		data: Buffer.alloc(32000).toString("base64"),
		mimeType: "audio/pcm;rate=16000",
	},
});
await new Promise((r) => setTimeout(r, 1500));
console.log(
	"session open:",
	setup,
	"closed:",
	JSON.stringify(closed),
	"messages:",
	msgs,
);
session.close();
process.exit(setup && !closed ? 0 : 1);
