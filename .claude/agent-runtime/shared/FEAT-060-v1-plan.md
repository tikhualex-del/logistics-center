# FEAT-060 v1 - Plan

Feature: dispatcher-zone-polygons
Task: 7.1c

## Scope

Render active delivery zones as Yandex Maps polygons.

## Acceptance

- Zone GeoJSON coordinates are converted from `[lng, lat]` to Yandex `[lat, lng]`.
- Only active zones render.
- Zone color comes from backend when available.

