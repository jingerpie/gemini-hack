# gemini-hack

Bun workspace with Turborepo.

```
apps/
  web/       front end: Vite, React, three.js (port 5273)
  server/    back end: Hono on Node (port 8787)
packages/
  catalog/   pre-built shop catalog: listings, images, build(THREE) models
  ui/        shared shadcn/ui components
  config/    shared tsconfig base
scripts/     dev utilities
```

## Getting started

Put `GEMINI_API_KEY=...` in the repo-root `.env`, then:

```bash
bun install
bun run dev          # both apps
bun run dev:web      # front end only
bun run dev:server   # back end only
bun run check-types
```

## Shared UI

Add shadcn/ui components to the shared package from the repo root:

```bash
npx shadcn@latest add dialog popover -c packages/ui
```

Import them as `@gemini-hack/ui/components/<name>`.
