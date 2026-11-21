# API server image for Cloudflare Containers. Build context is the repo root (see apps/edge/wrangler.jsonc).
FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/edge/package.json apps/edge/
COPY packages/catalog/package.json packages/catalog/
COPY packages/placement/package.json packages/placement/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
RUN bun install --frozen-lockfile --production --ignore-scripts --filter server

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=deps /app ./
COPY packages/catalog packages/catalog
COPY packages/placement packages/placement
COPY apps/server apps/server
EXPOSE 8787
CMD ["node", "apps/server/index.mjs"]
