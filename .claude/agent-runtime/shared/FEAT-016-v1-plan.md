# FEAT-016 v1 — Plan

## Feature
Domain event constants

## Goal
Create a shared `backend/src/common/events.constants.ts` file with the canonical internal NestJS EventEmitter event names from `CLAUDE.md` Section 3, so future modules do not use magic strings.

## Scope
- Add grouped domain event constants by domain.
- Add flat exports for ergonomic imports in services/listeners.
- Add a typed list of all domain event names.
- Add a small validation helper and a Jest spec for completeness and uniqueness.

## Expected Outcome
- Backend code can import domain event names from one source of truth.
- The event set matches `CLAUDE.md` exactly for Task `1.5`.
