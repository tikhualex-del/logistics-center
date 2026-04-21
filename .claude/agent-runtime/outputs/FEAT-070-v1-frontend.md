# FEAT-070 v1 frontend implementation

## Changes
- Added `PaymentRulesConstructor` and wired `/payments` to it.
- Added rule type selector, condition block and action block for zone rate, per-km, per-order, bonus, penalty and minimum guarantee rules.
- Added save flow for new rules and versioning flow for existing rules.
- Added local simulation against sample courier-period metrics.
- Added existing-rules panel with active/inactive state and edit selection.
- Updated payment-rule API types to match backend response fields.
- Added `createPaymentRule`, `updatePaymentRule`, `useCreatePaymentRule` and `useUpdatePaymentRule`.

## Verification
- `npm run build` passed.
- `npx eslint src/features/payments/payment-rules-constructor.tsx src/pages/payments.tsx src/api/payments.api.ts src/hooks/use-payments.ts src/api/query-keys.ts src/hooks/index.ts src/api/index.ts` passed.
