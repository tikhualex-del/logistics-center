id: FEAT-006-v1-msg-001
from: orchestrator
to: backend-implementer
type: task

## Topic
phase-0 finalize: fix backend reviewer blockers

## Feature
FEAT-006 / v1

## Context
Reviewer ran `approve with fixes` on tasks 0.1–0.4 (phase-0 bootstrap). The fixes below are all backend-related. No new features — fixes only. Do not touch phase-1 code.

## Required fixes

### Fix 1 — Install pino-pretty as devDependency
File: `backend/package.json`
Add `"pino-pretty": "^13.0.0"` (or latest stable) to `devDependencies`.
Reason: `app.module.ts:19` uses `transport: { target: 'pino-pretty' }` in non-production mode. Without the package, `npm run start:dev` fails with MODULE_NOT_FOUND.

### Fix 2 — ESLint: set no-explicit-any to error
File: `backend/eslint.config.mjs`
Change `'@typescript-eslint/no-explicit-any': 'off'` → `'@typescript-eslint/no-explicit-any': 'error'`
Reason: CLAUDE.md §8 and §22 explicitly prohibit `any`. Having it as 'off' violates the hard rules.

### Fix 3 — Add Redis vars to .env.example
File: `backend/.env.example`
Add after DATABASE_URL:
```
REDIS_HOST=localhost
REDIS_PORT=6379
```
Reason: Phase-1 uses Bull (queue) and @nestjs/throttler which may need Redis. These vars must be documented.

### Fix 4 — Split lint scripts
File: `backend/package.json`
Current: `"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"`
Change to:
- `"lint": "eslint \"{src,apps,libs,test}/**/*.ts\""` (read-only, no --fix)
- `"lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"` (separate)
Reason: CI should run `lint` without mutating files. Fixes must be explicit.

### Fix 5 — Raise ESLint strictness
File: `backend/eslint.config.mjs`
Change:
- `'@typescript-eslint/no-floating-promises': 'warn'` → `'@typescript-eslint/no-floating-promises': 'error'`
- `'@typescript-eslint/no-unsafe-argument': 'warn'` → `'@typescript-eslint/no-unsafe-argument': 'error'`
Reason: These are safety rules that catch real bugs. 'warn' is not enforcing. CLAUDE.md §8 requires strict mode.

### Fix 6 — Add backend/README.md with Prisma 7 note
Create `backend/README.md` with a brief note that the project uses Prisma 7 (latest at time of scaffolding) and that this was an intentional choice. Keep it short (5-10 lines max).

### Fix 7 — Git commit
After all fixes are applied and verified:
- Run `npm install` in `backend/` to install pino-pretty
- Stage and commit ALL project files that are currently untracked or modified:
  - `backend/` directory (all changes)
  - `frontend/` directory (all files)
  - `docker-compose.yml`
  - `.env.example` (root level if exists)
  - `.claude/agent-runtime/` (outputs/, shared/, state/, messages/)
  - `CLAUDE.md` and `README.md` if modified
- Commit message (English): `chore(phase-0): complete bootstrap scaffolding for backend, frontend, docker`
- Do NOT commit `frontend/node_modules/`, `backend/node_modules/`, `backend/dist/`, `.env` files (only `.env.example`)
- Verify `.gitignore` covers node_modules and dist before committing

## Constraints
- Do NOT start phase-1 work (no Prisma schema, no auth module, no guards)
- Do NOT touch frontend code
- Do NOT touch `frontend/src/pages/`, `frontend/src/features/` — phase-6 code stays as-is
- Stay within backend/ and root-level config files only (except for git commit which stages all)

## Output artifact
Create: `agent-runtime/outputs/FEAT-006-v1-backend.md`

Report must include:
- List of all files changed
- Confirmation that `npm install` ran successfully in backend/
- Confirmation that `npm run lint` passes (or list any remaining lint errors)
- Git commit hash
- Any risks or notes

## Deadline
immediate
