# FEAT-040 Plan

## Goal
Implement the inbound CRM order API so external systems can push orders into Logistics Center with strict validation, idempotency protection, and external-to-internal order mapping.

## Scope
- add public `POST /api/v1/integrations/orders`
- require `Idempotency-Key`, `X-Integration-Name`, and `X-Integration-Secret`
- validate inbound order payload strictly
- authenticate inbound integration via configured secret
- log inbound requests in `integration_events`
- cache duplicate requests by idempotency key without reprocessing
- persist `external_id_map` entries for imported orders
- reuse existing orders safely when the external ID is already mapped
- add SQL migration for `external_id_map` and integration-event idempotency unique index

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/integrations/integrations.service.spec.ts src/modules/integrations/integrations.controller.spec.ts src/modules/orders/orders.service.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
- `prisma migrate deploy --schema prisma/schema.prisma`
