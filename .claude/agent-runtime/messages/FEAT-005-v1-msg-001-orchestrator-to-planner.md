id: FEAT-005-v1-msg-001
from: orchestrator
to: planner
type: handoff

## Topic
Plan health endpoints for NestJS backend

## Feature
FEAT-005 v1 вЂ” Health endpoints (liveness + readiness)

## Task
Decompose the implementation of health endpoints as required by CLAUDE.md Section 14 (Observability).

Required endpoints:
- GET /health вЂ” basic liveness (returns 200 if server is up)
- GET /health/ready вЂ” readiness check (verifies DB connection, queue connectivity)

## Context
- Backend exists at: backend/ (NestJS + Prisma + PostgreSQL)
- Stack: NestJS, Prisma, Bull queues
- This is a backend-only task вЂ” no frontend or UX review needed
- No new Prisma schema changes required

## Constraints
- MVP scope only вЂ” no metrics, no distributed tracing
- Must follow CLAUDE.md conventions (no `any`, structured responses, etc.)
- No authentication required on health endpoints (they are public)
- Should use @nestjs/terminus (standard NestJS health checks library)

## Output
Produce: agent-runtime/shared/FEAT-005-v1-plan.md

## Deadline
immediate

