# FEAT-024 Plan

## Scope

- Add a tenant-aware `companies` backend module for current company profile access.
- Support company profile update and company feature flags management.
- Provide reusable `FeatureFlagsService.isEnabled(flag, companyId)`.

## Implementation Notes

- Use `runWithoutTenant(...)` for `Company` reads and updates because `Company` is the tenant root model.
- Use `runWithTenant(...)` for `CompanyFeature` access so `company_id` filtering stays automatic.
- Keep company updates admin-only while allowing authenticated reads for current company data.

## Verification

- `npx tsc --noEmit`
- `npx jest src/modules/companies/companies.service.spec.ts src/modules/companies/companies.controller.spec.ts src/modules/companies/feature-flags.service.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand`
