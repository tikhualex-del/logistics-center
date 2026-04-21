# FEAT-033 Plan

## Goal
Implement task `3.4b` as a concrete `YandexRoutingProvider` with a development-safe mock fallback.

## Scope
- Add a `YandexRoutingProvider` that implements the `RoutingProvider` contract
- Support `buildRoute`, `calculateDistance`, and `geocode`
- Use `ConfigService` for API keys, base URLs, timeout, and provider mode
- Fall back to deterministic mock routing in `auto/mock` mode when keys are absent
- Export the provider through `RoutingModule` using the `ROUTING_PROVIDER` token
- Add unit tests for mock mode and Yandex response parsing

## Verification
- `npx tsc --noEmit`
- `npx jest src/modules/routing/providers/routing-provider.interface.spec.ts src/modules/routing/providers/yandex-routing.provider.spec.ts --runInBand`
- `npx jest test/app.e2e-spec.ts test/swagger.e2e-spec.ts --config ./test/jest-e2e.json --runInBand --forceExit`
