# FEAT-080 v1 Plan

Task: 9.2a Frontend auth tests

Scope:
- Add frontend test runner configuration for Vitest and Testing Library.
- Cover login mutation behavior: token persistence, auth store update, and redirect.
- Cover auth route guards for protected/public role redirects.
- Cover HTTP 401 refresh flow: refresh token request, retried original request, and updated auth state.

Out of scope:
- Changing runtime auth behavior beyond the small export needed for interceptor testing.
- Reworking existing page implementations.

Verification:
- Frontend lint.
- Targeted frontend auth tests.
- Frontend production build.
