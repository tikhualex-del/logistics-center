# FEAT-071 v1 plan

## Task
8.2b - Payments list and details.

## Scope
- Add a payout register to the payments page without removing the rule constructor.
- Align frontend payment API types with backend payment DTOs.
- Fetch payments with filters for status, courier and period.
- Show courier, period, amount, status and breakdown summary in a table.
- Open a payment detail panel on row click.
- Support eligible approve/dispute transitions through the backend status endpoint.

## Validation
- `npm run lint`
- `npm run build`
