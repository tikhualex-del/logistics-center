# FEAT-009 v1 Plan

- Upgrade `PrismaService` to a Prisma 7-compatible runtime client with a PostgreSQL driver adapter.
- Add tenant context utilities and Prisma middleware that auto-apply `company_id` to tenant-scoped models.
- Expose explicit tenant-scoped execution helpers for future service-layer and guard integration.
- Validate the new tenant isolation layer with focused tests and backend compilation.
