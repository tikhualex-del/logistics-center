# FEAT-074 v1 plan

## Task
9.1a - Auth flow tests.

## Scope
- Extend existing auth unit tests for register, login and refresh flows.
- Add explicit checks for access-token and refresh-token expiration settings.
- Keep implementation scoped to tests only.

## Validation
- `npx jest src/modules/auth/auth.service.spec.ts src/modules/auth/auth.controller.spec.ts --runInBand`
- `npx eslint src/modules/auth/auth.service.spec.ts`
- `npm run build`
