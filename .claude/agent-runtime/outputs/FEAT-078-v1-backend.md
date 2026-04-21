# FEAT-078 v1 backend

Implemented RBAC coverage for:
- admin receiving every declared permission
- dispatcher and courier receiving only their expected permission sets
- privileged permissions denied to non-admin roles
- every role permission remaining inside the declared permission catalog
- permission guard behavior across payment rules, orders, routes, own earnings, user management, and multi-permission routes

Verification:
- `npx jest src/modules/auth/permissions/permission-matrix.spec.ts src/modules/auth/guards/permissions.guard.spec.ts src/modules/auth/guards/roles.guard.spec.ts --runInBand`
- `npx eslint src/modules/auth/permissions/permission-matrix.spec.ts src/modules/auth/guards/permissions.guard.spec.ts`
- `npm run build`

