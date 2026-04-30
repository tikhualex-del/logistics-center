# Phase 11.9 - README run instructions

Date: 2026-04-30
Status: completed
Depends on: 11.7

## Updated

- Rewrote root `README.md` for the canonical stack after `apps/*` removal.
- Documented requirements: Node.js 22+, npm 10+, Docker Compose, PostgreSQL 16, Redis 7.
- Documented env files:
  - root `.env` for Docker Compose and shared backend config
  - `backend/.env` for backend overrides
  - `frontend/.env` for Vite `VITE_*` variables
- Documented root install flow and Prisma setup.
- Documented `npm run dev` from the repository root:
  - backend: `http://localhost:3000`
  - frontend: `http://localhost:5173`
- Documented backend URLs:
  - Swagger: `http://localhost:3000/api/docs`
  - liveness: `http://localhost:3000/health`
  - readiness: `http://localhost:3000/health/ready`
- Documented root `lint`, `typecheck`, `build`, and `test` commands.
- Updated `.env.example` and `backend/.env.example` to use PostgreSQL host port `5433`, matching `docker-compose.yml`.

## Verification

- `rg` found no live README/root script references to deleted `apps/api`, `apps/web`, or `apps/map`.
- `npm run typecheck` passed.

## Notes

- `npm run dev` was not left running because it is a long-lived development process.
