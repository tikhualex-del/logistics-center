id: FEAT-003-v1-msg-001
from: orchestrator
to: backend-implementer
type: task

## Topic
Task 0.3 вЂ” Docker + Database setup (PostgreSQL 16 + Redis + Prisma init)

## Feature
FEAT-003 v1

## Task
Set up Docker environment and initialize Prisma for Logistics Center.

Working directory: `C:\logistics center\`

### 1. docker-compose.yml (root of project)

Create `docker-compose.yml` with two services:
- **PostgreSQL 16**:
  - image: `postgres:16-alpine`
  - env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (use `logistics_center` as DB name)
  - port: `5432:5432`
  - volume: `postgres_data:/var/lib/postgresql/data`
  - healthcheck
- **Redis**:
  - image: `redis:7-alpine`
  - port: `6379:6379`
  - volume: `redis_data:/data`
  - healthcheck

Include named volumes at bottom: `postgres_data`, `redis_data`.

### 2. Prisma initialization

Inside `backend/`:
- Run `npx prisma init` (or create manually) to generate:
  - `backend/prisma/schema.prisma`
  - Update `DATABASE_URL` reference in schema to match `.env.example`
- In `schema.prisma`:
  - provider: `postgresql`
  - `generator client` with `provider = "prisma-client-js"`
  - datasource pointing to `env("DATABASE_URL")`
  - Add a placeholder `Company` model (minimal, just id + timestamps) to confirm schema is valid
- Update `backend/.env.example` to include correct `DATABASE_URL` format:
  ```
  DATABASE_URL="postgresql://postgres:password@localhost:5432/logistics_center?schema=public"
  ```

### 3. PrismaService

Create `backend/src/prisma/prisma.service.ts` вЂ” a NestJS service extending `PrismaClient` that:
- extends `PrismaClient`
- implements `OnModuleInit` to call `$connect()`
- implements `OnModuleDestroy` to call `$disconnect()`

Create `backend/src/prisma/prisma.module.ts` вЂ” a global NestJS module that exports `PrismaService`.

### 4. README note (optional)

Optionally add a brief `## Local Development` section to `README.md` explaining:
- `docker-compose up -d` to start DB + Redis
- `npm run start:dev` to start backend

## Constraints
- Docker Compose format version: omit `version:` field (obsolete in modern Docker Compose)
- No secrets in committed files вЂ” `docker-compose.yml` uses env variable references or example defaults only
- Prisma schema must pass `npx prisma validate`
- Follow CLAUDE.md Section 5 (multi-tenant isolation) вЂ” all future tables will have `company_id`
- Follow CLAUDE.md Section 10 (migration discipline) вЂ” no manual SQL

## Output
After completion, write your summary report to:
`C:\logistics center\.claude\agent-runtime\outputs\FEAT-003-v1-backend.md`

## Deadline
immediate

