// Headless Chromium test of the real browser path (getUserMedia -> AudioWorklet -> GeminiStt / fallback).
// Chrome's fake capture device plays a WAV built from the natural clip. Needs the test Vite server running:
//   npx vite --config web/src/voice/test/vite.config.mjs          (port 5392, from apps/)
//   node web/src/voice/test/run-browser.mjs [query] [seconds]     e.g. "" | "stt=browser" | "stt=gemini"
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const PW =
	process.env.PLAYWRIGHT_DIR ||
	"C:/Users/rohan/AppData/Local/Temp/claude/C--Users-rohan-Desktop-Work-STUFF-Projects-gemini-hack/cd9c07f4-1fda-4509-9004-3f7692f11165/scratchpad/world_test/codegen/node_modules/playwright";
const AUDIO_DIR =
	process.env.VOICE_AUDIO_DIR ||
	"C:/Users/rohan/AppData/Local/Temp/claude/C--Users-rohan-Desktop-Work-STUFF-Projects-gemini-hack/cd9c07f4-1fda-4509-9004-3f7692f11165/scratchpad/live_test/audio";
const OUT_DIR = process.env.VOICE_OUT_DIR || path.dirname(AUDIO_DIR);
const { chromium } = createRequire(import.meta.url)(PW);

const query = process.argv[2] || "";
const seconds = +(process.argv[3] || 30);

// natural scenario at 48 kHz (Chrome loops the file; the run stops before it repeats)
const LEAD = 1500;
const SC = [
	["s0", 700],
	["s1", 1000],
	["s2", 1000],
	["s3", 0],
];
const RATE = 48000;
const chunks = [new Int16Array((LEAD * RATE) / 1000)];
const schedule = [];
let cur = LEAD;
for (const [k, gap] of SC) {
	const b = fs.readFileSync(path.join(AUDIO_DIR, `${k}.pcm`));
	const p16 = new Int16Array(
		b.buffer.slice(b.byteOffset, b.byteOffset + b.length),
	);
	const up = new Int16Array(p16.length * 3);
	for (let i = 0; i < p16.length; i++) {
		const a = p16[i];
		const c = p16[i + 1] ?? a;
		up[3 * i] = a;
		up[3 * i + 1] = Math.round(a + (c - a) / 3);
		up[3 * i + 2] = Math.round(a + (2 * (c - a)) / 3);
	}
	const d = (p16.length / 16000) * 1000;
	schedule.push({ k, start: cur, end: cur + d });
	chunks.push(up, new Int16Array(Math.round((gap * RATE) / 1000)));
	cur += d + gap;
}
chunks.push(new Int16Array(RATE * 8));
const len = chunks.reduce((n, c) => n + c.length, 0);
const wav = Buffer.alloc(44 + len * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + len * 2, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(len * 2, 40);
{
	let o = 44;
	for (const c of chunks)
		Buffer.from(c.buffer, c.byteOffset, c.byteLength).copy(wav, o),
			(o += c.byteLength);
}
const wavPath = path.join(OUT_DIR, "voice_natural_48k.wav");
fs.writeFileSync(wavPath, wav);

const browser = await chromium.launch({
	headless: true,
	args: [
		"--use-fake-ui-for-media-stream",
		"--use-fake-device-for-media-stream",
		`--use-file-for-fake-audio-capture=${wavPath}`,
		"--autoplay-policy=no-user-gesture-required",
	],
});
const page = await browser.newPage();
page.on("console", (m) => {
	const t = m.text();
	if (t.startsWith("[voice]") || m.type() === "error" || m.type() === "warning")
		console.log("  page:", t.slice(0, 200));
});
page.on("pageerror", (e) => console.log("  PAGE ERROR:", e.message));
await page.goto(`http://localhost:5392/${query ? "?" + query : ""}`);
await page.click("#start");
await page.waitForTimeout(seconds * 1000);
const levels = await page.evaluate(() => window.__levels || 0);
await page.click("#stop");
await page.waitForTimeout(300);
const ev = await page.evaluate(() => window.__voice);
await browser.close();

const firstLoud = ev.find((e) => e.kind === "level" && e.level > 0.3);
const audio0 = firstLoud ? firstLoud.t - schedule[0].start : 0; // page time at which the WAV started
console.log(
	`\nquery "${query}": onLevel calls ${levels} in ${seconds}s (${(levels / seconds).toFixed(1)}/s); audio start ~${Math.round(audio0)}ms`,
);
for (const e of ev.filter((e) => e.kind === "state"))
	console.log(
		`  ${String(Math.round(e.t)).padStart(6)} state ${e.text} ${e.detail ?? ""}`,
	);
for (const e of ev.filter((e) => e.kind === "utterance")) {
	const at = e.t - audio0;
	const ended = schedule.filter((s) => s.end <= at).at(-1);
	console.log(
		`  ${String(Math.round(e.t)).padStart(6)} UTTERANCE +${ended ? Math.round(at - ended.end) : "?"}ms after end of ${ended?.k}: ${e.text}`,
	);
}
console.log(
	`  interim events: ${ev.filter((e) => e.kind === "interim").length}`,
);
process.exit(0);
