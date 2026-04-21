# FEAT-014 v1 Plan

- Centralize the `nestjs-pino` configuration so all logs use the API-required field names and timestamp format.
- Include `requestId` on every log entry and `companyId` whenever the active async context contains a tenant.
- Verify the logger output with a real HTTP request and captured JSON logs for both application logs and auto HTTP logs.
