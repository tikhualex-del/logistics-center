id: FEAT-005-v1-msg-002
from: orchestrator
to: backend-implementer
type: handoff

## Topic
Implement health endpoints per FEAT-005 plan

## Feature
FEAT-005 v1 вЂ” Health endpoints (liveness + readiness)

## Input Artifacts
- agent-runtime/shared/FEAT-005-v1-plan.md

## Task
Implement all backend code described in the plan. Follow CLAUDE.md strictly.

Key points:
- Install @nestjs/terminus (npm install in backend/)
- Create backend/src/modules/health/ module with controller + indicators
- Fix main.ts global prefix exclusion for /health routes
- Register HealthModule in AppModule
- Write unit test health.controller.spec.ts

## Constraints
- No `any` types
- No auth guards on health endpoints
- Must not break existing api/v1/* routing
- No Prisma schema changes
- MVP scope only

## Output
Produce: agent-runtime/outputs/FEAT-005-v1-backend.md

## Deadline
immediate

