# FEAT-075 v1 backend

Implemented tenant isolation coverage for:
- read filters overriding caller-provided `company_id`
- destructive filters on `deleteMany`
- `createMany` tenant injection and mismatch rejection
- `upsert` where isolation, create injection, and update mismatch rejection
- nested tenant scope restoration
- temporary bypass scope restoration

Fixed `applyTenantIsolation` so `upsert` injects `company_id` into `create` and validates tenant writes in `update`.

Verification:
- `npx jest src/prisma/tenant-prisma.helper.spec.ts src/prisma/tenant-context.service.spec.ts --runInBand`
- `npx eslint src/prisma/tenant-prisma.helper.ts src/prisma/tenant-prisma.helper.spec.ts src/prisma/tenant-context.service.spec.ts`
- `npm run build`

