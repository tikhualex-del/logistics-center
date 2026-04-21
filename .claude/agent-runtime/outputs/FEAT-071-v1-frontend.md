# FEAT-071 v1 frontend implementation

## Changes
- Added `PaymentsLedger` below the payment rules constructor.
- Added filters for payment status, courier and period boundaries.
- Added payments table with courier, period, amount, status and breakdown summary.
- Added payment detail panel with metrics, component-level breakdown and transition reason.
- Added approve action for calculated payments and dispute action for paid payments.
- Updated payment API types to match backend response fields (`amount`, `currency`, object `breakdown`, metadata and approval fields).
- Added `updatePaymentStatus` API function and `useUpdatePaymentStatus` hook.

## Verification
- `npm run lint` passed.
- `npm run build` passed.
