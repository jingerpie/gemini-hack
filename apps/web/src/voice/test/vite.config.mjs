// Test-only Vite config: serves voice/test/ on :5392 and answers GET /api/token itself (minting an ephemeral token
// server-side in this Node process, exactly like the real server should), so the page can run without the studio server.
//   npx vite --config web/src/voice/test/vite.config.mjs        (from apps/)
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

const ENV_FILE = process.env.ENV_FILE || path.resolve(import.meta.dirname, "../../../../../.env");
const MODEL = "gemini-3.5-transcribe-live";

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const line = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/).find((l) => /^\s*GEMINI_API_KEY\s*=/.test(l));
  return line.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
}

function tokenPlugin() {
  return {
    name: "voice-test-token",
    configureServer(server) {
      server.middlewares.use("/api/token", async (req, res) => {
        if (process.env.VOICE_TEST_TOKEN_FAIL) {
          res.statusCode = 503;
          return res.end("token disabled for fallback test");
        }
        try {
          const ai = new GoogleGenAI({ apiKey: loadKey(), httpOptions: { apiVersion: "v1alpha" } });
          const now = Date.now();
          const tok = await ai.authTokens.create({
            config: {
              uses: 1,
              expireTime: new Date(now + 30 * 60e3).toISOString(),
              newSessionExpireTime: new Date(now + 60e3).toISOString(),
              liveConnectConstraints: {
                model: MODEL,
                config: { responseModalities: [Modality.TEXT], inputAudioTranscription: { languageCodes: ["en-US"] } },
              },
            },
          });
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ token: tok.name, model: MODEL, apiVersion: "v1alpha" }));
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e?.message || e));
        }
      });
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [tokenPlugin()],
  server: { port: 5392, strictPort: true },
  logLevel: "warn",
});
