import { createRequire } from "node:module";
import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
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
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
	],
	resolve: { alias: { "@catalog": catalogDir } },
	server: {
		port: 5273,
		proxy: { "/api": process.env.API_URL ?? "http://localhost:8787" },
	},
});
