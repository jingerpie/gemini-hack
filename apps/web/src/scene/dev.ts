// Standalone harness for the scene engine: open /src/scene/dev.html on the Vite dev server.
// Exposes `window.engine` so it can be driven from the console or Playwright.
import { createEngine } from "./engine";

const engine = createEngine(document.getElementById("stage")!);
(window as unknown as Record<string, unknown>).engine = engine;
engine.subscribe((s) =>
	console.debug(
		"[dev] scene changed",
		s.objects.length,
		"objects",
		s.decals.length,
		"decals",
	),
);
(window as unknown as Record<string, unknown>).__engineReady = true;
