# FEAT-015 v1 Plan

- Register a global `@nestjs/throttler` guard so HTTP endpoints are actually rate-limited, not just configured.
- Keep the default app-wide throttle policy in the root module and make the guard compatible with the existing response/error pipeline.
- Verify the behavior with a focused HTTP test that triggers `429 Too Many Requests` and preserves the standard API error shape.
