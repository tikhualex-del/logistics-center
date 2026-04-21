# FEAT-059 v1 - Plan

Feature: dispatcher-order-markers
Task: 7.1b

## Scope

Render orders as Yandex Maps placemarks.

## Acceptance

- Orders with coordinates appear as map markers.
- Marker color follows order status.
- Clicking a marker selects the order in `useUiStore` so the right panel highlights it.
- Markers follow current dispatcher date/status/search/time-slot filters.

