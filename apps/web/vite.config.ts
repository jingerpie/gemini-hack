import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Catalog files live in the @gemini-hack/catalog package; the alias lets import.meta.glob reach them.
const catalogDir = path.join(
	path.dirname(
		createRequire(import.meta.url).resolve("@gemini-hack/catalog/package.json"),
	),
	"mock-shop",
);

export default defineConfig({
	root: __dirname,
	plugins: [react()],
	resolve: { alias: { "@catalog": catalogDir } },
	server: { port: 5273, proxy: { "/api": "http://localhost:8787" } },
});
