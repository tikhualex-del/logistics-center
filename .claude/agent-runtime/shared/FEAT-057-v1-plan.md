# FEAT-057 v1 - Plan

Feature: dispatcher-top-bar-filters
Task: 7.1f

## Scope

Finish dispatcher top bar filters:
- selected date defaults to local today
- search by order number, external id, customer, phone, address
- status filter
- time-slot filter

## Acceptance

- Filters share state through `useUiStore`.
- Backend only receives supported order query params (`date`, `status`).
- Search and time slot are applied client-side until backend exposes those filters.

