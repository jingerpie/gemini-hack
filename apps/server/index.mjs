// Studio backend entry: serves the Hono app (app.mjs) on Node. Run: node apps/server/index.mjs   (PORT env, default 8787)
import { serve } from "@hono/node-server";
import { app } from "./app.mjs";
import { assetConfig } from "./asset.mjs";
import { PATCH_MODEL } from "./patch.mjs";

const PORT = +(process.env.PORT || 8787);

const server = serve({ fetch: app.fetch, port: PORT }, () =>
	console.log(
		`studio server on http://localhost:${PORT} (patch=${PATCH_MODEL}, agent=${assetConfig.AGENT}, three=${assetConfig.threeLoaded})`,
	),
);
server.requestTimeout = 0; // SSE asset streams can run > 5 min worst case
