# FEAT-080 v1 Frontend Output

Implemented task 9.2a: Frontend auth tests.

Changes:
- Added Vitest, jsdom, Testing Library, jest-dom, user-event, and axios-mock-adapter as frontend dev dependencies.
- Added `test` script and Vitest jsdom setup in `frontend/vite.config.ts`.
- Added shared test setup and render helpers under `frontend/src/test`.
- Added login mutation test for successful login, persisted tokens, auth store update, and redirect.
- Added auth route guard tests for protected, public, and role-based redirects.
- Added HTTP client test for 401 refresh and retry flow.
- Exported `refreshClient` from `frontend/src/api/http-client.ts` so the refresh path can be mocked directly in tests.

Verification:
- `npm run lint -- src/features/auth/use-auth-mutations.test.tsx src/components/auth-routes.test.tsx src/api/http-client.test.ts src/test/setup.ts src/test/test-utils.tsx src/test/auth-test-helpers.ts vite.config.ts`
- `npm test -- --run src/features/auth/use-auth-mutations.test.tsx src/components/auth-routes.test.tsx src/api/http-client.test.ts`
- `npm run build`
