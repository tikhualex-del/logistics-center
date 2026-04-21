# FEAT-025 Plan

## Scope

- Add reusable auth decorators: `@CurrentUser()` and `@Public()`.
- Keep existing `@Roles()` and `@RequirePermission()` as the RBAC metadata decorators for guarded routes.
- Apply decorators in real controllers and update access guards to respect public-route metadata.

## Implementation Notes

- `@CurrentUser()` should support full user injection and property-level extraction.
- `@Public()` should bypass global auth/tenant/role/permission guards for controller routes.
- Swagger UI still uses path-based bypass because it is registered outside controllers.

## Verification

- `npx tsc --noEmit`
- `npx jest src/modules/auth/auth.controller.spec.ts src/modules/auth/guards/jwt-auth.guard.spec.ts src/modules/auth/guards/tenant.guard.spec.ts src/modules/auth/guards/roles.guard.spec.ts src/modules/auth/guards/permissions.guard.spec.ts src/modules/users/users.controller.spec.ts src/modules/companies/companies.controller.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/health.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
