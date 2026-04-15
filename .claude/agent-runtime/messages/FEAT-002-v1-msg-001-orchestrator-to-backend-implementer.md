id: FEAT-002-v1-msg-001
from: orchestrator
to: backend-implementer
type: task

## Topic
Task 0.2 вЂ” Backend scaffold (NestJS project initialization)

## Feature
FEAT-002 v1

## Task
Bootstrap the NestJS backend project for Logistics Center.

Create the full backend scaffold at `C:\logistics center\backend\` with the following:

1. Initialize NestJS project using `nest new backend --package-manager npm --skip-git` (or equivalent manual setup if CLI not available)
2. Configure `tsconfig.json` with `strict: true`, `strictNullChecks`, `noImplicitAny`
3. Install all required dependencies per CLAUDE.md:
   - `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` (already from nest new)
   - `@nestjs/config` вЂ” env management
   - `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local` вЂ” auth
   - `@nestjs/swagger`, `swagger-ui-express` вЂ” API docs
   - `@nestjs/throttler` вЂ” rate limiting
   - `@nestjs/bull`, `bull` вЂ” queues
   - `@nestjs/event-emitter` вЂ” internal events
   - `prisma`, `@prisma/client` вЂ” ORM
   - `class-validator`, `class-transformer` вЂ” DTO validation
   - `bcrypt`, `@types/bcrypt` вЂ” password hashing
   - `pino`, `pino-http`, `nestjs-pino` вЂ” structured logging
   - `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io` вЂ” real-time
   - `uuid` вЂ” UUID generation
   - `@types/uuid`, `@types/passport-jwt`, `@types/passport-local`, `@types/bull` (dev deps)
4. Create `.env.example` with all variables from CLAUDE.md Section 20:
   ```
   DATABASE_URL=
   JWT_SECRET=
   JWT_REFRESH_SECRET=
   YANDEX_MAPS_API_KEY=
   YANDEX_ROUTING_API_KEY=
   GIGACHAT_CLIENT_ID=
   GIGACHAT_CLIENT_SECRET=
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   SENTRY_DSN=
   ```
5. Configure ESLint and Prettier (NestJS defaults are fine, ensure they are present)
6. Set up basic folder structure per CLAUDE.md Section 3:
   ```
   backend/src/
   в”њв”Ђв”Ђ modules/
   в”њв”Ђв”Ђ common/
   в”њв”Ђв”Ђ prisma/
   в””в”Ђв”Ђ main.ts
   ```
7. In `main.ts`: configure swagger, global validation pipe (class-validator), and CORS placeholder
8. Ensure `npm run start:dev`, `npm run build`, `npm run lint` scripts work

## Constraints
- Stack: NestJS + TypeScript (strict mode)
- No code outside backend/ (frontend, mobile are separate)
- Follow CLAUDE.md Section 8 naming conventions (kebab-case files)
- No `.env` committed вЂ” only `.env.example`
- No `any` in TypeScript
- Phase 0 only вЂ” no domain modules yet (orders, auth, etc.) вЂ” those come later

## Output
After completion, write your summary report to:
`C:\logistics center\.claude\agent-runtime\outputs\FEAT-002-v1-backend.md`

## Deadline
immediate

