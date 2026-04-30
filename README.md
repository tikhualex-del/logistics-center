# Logistics Center

SaaS platform for end-to-end logistics department management. Designed for
small and medium businesses with their own delivery operations.

For project rules, architecture, and conventions, see [CLAUDE.md](./CLAUDE.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis, Socket.io |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Yandex Maps |
| Mobile | Expo, React Native (Phase 2) |
| Infrastructure | Railway, Vercel, GitHub Actions |

## Requirements

- Node.js 22+
- npm 10+
- Docker with Docker Compose
- PostgreSQL 16 and Redis 7, usually started through `docker compose`

## Environment

Copy the example files before the first run:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell, use `Copy-Item` instead of `cp`.

Root `.env` is used by Docker Compose and is also loaded by the backend.
`backend/.env` can override backend-only values. `frontend/.env` contains
Vite variables and must use the `VITE_` prefix.

Important local defaults:

| Variable | File | Default |
|---|---|---|
| `DATABASE_URL` | `.env`, `backend/.env` | `postgresql://postgres:password@localhost:5433/logistics_center?schema=public` |
| `REDIS_URL` | `.env` | `redis://localhost:6379` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | `.env`, `backend/.env` | replace before production |
| `VITE_API_URL` | `frontend/.env` | `http://localhost:3000` |
| `VITE_WS_URL` | `frontend/.env` | `http://localhost:3000` |
| `VITE_YANDEX_MAPS_API_KEY` | `frontend/.env` | required for the dispatcher map |

`docker-compose.yml` publishes PostgreSQL on host port `5433` and Redis on
host port `6379`.

## Install

Install root tooling and both application workspaces:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## Database

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Prepare Prisma:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

## Run

Start the canonical development stack from the repository root:

```bash
npm run dev
```

This starts:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Useful backend URLs:

- Swagger UI: `http://localhost:3000/api/docs`
- Liveness: `http://localhost:3000/health`
- Readiness: `http://localhost:3000/health/ready`

You can also start each side separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Checks

Root commands proxy to the canonical backend and frontend:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Backend tests run with `jest --runInBand` from the root script to avoid worker
spawn issues in restricted Windows shells.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - project rules and conventions
- [docs/FOUNDATION.md](./docs/FOUNDATION.md) - system overview
- [docs/COMPANIES_DOMAIN.md](./docs/COMPANIES_DOMAIN.md) - companies domain notes

## License

Private. All rights reserved.
