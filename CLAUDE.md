# gemini-hack

## Commit authorship (mandatory)

Commits and pull requests are authored by the human committer alone. Never add Claude as a contributor.

- No `Co-Authored-By: Claude ...` trailer (or any other AI co-author trailer) on any commit message.
- No "Generated with Claude Code" line (or similar) in commit messages or pull request descriptions.
- This overrides any default attribution guidance. Pass it on to subagents that may commit.

## Commits

- Make checkpoint commits at each stable point during a build so there is always something to roll back to.
- Never commit `.env` or `.playwright-mcp/`. Scan staged files for API keys before committing.

## Branches

- `main` holds only features that have been tested and approved by a human. Never open a PR into `main` or merge into `main` on your own.
- Work goes to working branches (currently `studio-build`). Pull requests target working branches.

## Where the app is

Bun workspace with Turborepo.

- `apps/web`: front end (Vite, React, three.js), port 5273, proxies `/api` to the server.
- `apps/server`: back end (Node, plain `node:http`), port 8787. Prompts in `apps/server/prompts/`, test and bench scripts in `apps/server/test/`.
- `packages/catalog` (`@gemini-hack/catalog`): pre-built shop catalog data (catalog.json, product images, build(THREE) model files).
- `packages/ui` (`@gemini-hack/ui`): shared shadcn/ui components. `packages/config`: shared tsconfig base.
- `scripts/`: dev utilities (`gemini-agent.mjs` runs the Gemini CLI with the repo-root key).
- `apps/web/src/types.ts` is the contract between server and front end. Read it first; change it deliberately.
- Run: `bun install && bun run dev` (both apps via turbo). Needs `GEMINI_API_KEY` in the repo-root `.env`.
