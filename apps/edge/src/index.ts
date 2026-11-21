// Edge entry for hackathon.sparkyidea.com.
// Static assets (apps/web/dist) are served by Workers Assets; /api/* goes to the Node server running in a Container.
// The server needs node:vm to run generated three.js code, which Workers cannot do, so it stays a Node process.
import { Container, getContainer } from "@cloudflare/containers";

interface Env {
	API: DurableObjectNamespace<ApiServer>;
	ASSETS: Fetcher;
	GEMINI_API_KEY: string;
}

export class ApiServer extends Container<Env> {
	defaultPort = 8787;
	sleepAfter = "30m";

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.envVars = {
			PORT: "8787",
			NODE_ENV: "production",
			GEMINI_API_KEY: env.GEMINI_API_KEY,
			GEMINI_KEY_FROM_ENV: "1",
		};
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api/")) {
			// One named instance: the server keeps in-memory state (limiter, stats, caches).
			return getContainer(env.API, "main").fetch(request);
		}
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
