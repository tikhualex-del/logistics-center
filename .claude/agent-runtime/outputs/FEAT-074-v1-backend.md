# FEAT-074 v1 backend implementation

## Changes
- Extended `AuthService` tests to assert access token TTL is `15m` during register, login and refresh.
- Extended login and refresh tests to assert refresh token TTL is `30d`.
- Kept existing register, login, refresh, logout and validate-user coverage intact.

## Verification
- `npx jest src/modules/auth/auth.service.spec.ts src/modules/auth/auth.controller.spec.ts --runInBand` passed.
- `npx eslint src/modules/auth/auth.service.spec.ts` passed.
- `npm run build` passed.

## Notes
- A plain Jest run without `--runInBand` hit the local sandbox `spawn EPERM` worker-process restriction.
- Full backend lint still reports pre-existing repository-wide issues unrelated to this auth test change.
