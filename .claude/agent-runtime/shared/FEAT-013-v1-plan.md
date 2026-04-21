# FEAT-013 v1 Plan

- Move the app-wide validation configuration from bootstrap code into a reusable global `APP_PIPE` provider.
- Keep strict validation defaults: transform input, strip unknown fields, and reject non-whitelisted payload properties.
- Verify the real HTTP behavior with a focused DTO-based test that covers transformation and validation errors.
