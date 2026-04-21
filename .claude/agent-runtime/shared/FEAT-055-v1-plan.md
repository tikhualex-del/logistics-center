# FEAT-055 v1 — Plan: Yandex Maps Integration (MapView Component)

Feature: 7.1a — Yandex Maps интеграция
Version: v1
Agent: planner

---

## Scope

Frontend-only task. No backend changes required.
Goal: integrate Yandex Maps JS API and render a base map in the dispatcher workspace.

---

## Implementation Steps

### Step 1: Yandex Maps loader utility
File: `frontend/src/lib/yandex-maps-loader.ts`

- Singleton async loader: injects `<script>` tag into document head
- API URL: `https://api-maps.yandex.ru/2.1/?apikey={KEY}&lang=ru_RU`
- Returns promise that resolves when `window.ymaps` is ready (`ymaps.ready`)
- Handles cases: key missing (throws), already loaded (resolves immediately), duplicate calls (returns same promise)
- Exports: `loadYandexMaps(): Promise<typeof window.ymaps>`

### Step 2: TypeScript declaration for window.ymaps
File: `frontend/src/types/yandex-maps.d.ts`

- Minimal global type declaration for `window.ymaps`
- Covers: `Map`, `ready()`, `GeoObject`, coordinates array `[lat, lng]`
- Enough for MapView to compile without `any`

### Step 3: useYandexMap hook
File: `frontend/src/hooks/use-yandex-map.ts`

- Accepts: `containerRef: React.RefObject<HTMLDivElement>`, `options?: { center?, zoom? }`
- Internally calls `loadYandexMaps()` on mount
- Creates `ymaps.Map` instance bound to container
- Returns: `{ mapInstance, isLoading, error }`
- Destroys map on unmount (cleanup)
- Default center: [55.75, 37.62] (Moscow), zoom: 10

### Step 4: MapView component
File: `frontend/src/features/dispatcher/map-view.tsx`

- Uses `useYandexMap` hook
- Container div: `position: absolute; inset: 0` (fills parent completely)
- Loading state: centered spinner overlay
- Error state: centered message "Map unavailable" with reason
- No API key state: shows warning (VITE_YANDEX_MAPS_API_KEY not set)
- Exports named: `MapView`

### Step 5: Update dispatcher page
File: `frontend/src/pages/dispatcher.tsx`

- Replace map placeholder with `<MapView />`
- MapView fills the `<main>` area (flex-1, relative, overflow hidden)
- Route build controls remain in bottom-left overlay (absolute positioned)
- Keep existing showRoutes/showCouriers/selectedOrderId logic

### Step 6: Features index export
File: `frontend/src/features/dispatcher/index.ts` (create if missing)

- Export `MapView` from `./map-view`

---

## File Structure

```
frontend/src/
├── lib/
│   └── yandex-maps-loader.ts     (NEW)
├── types/
│   └── yandex-maps.d.ts          (NEW)
├── hooks/
│   └── use-yandex-map.ts         (NEW)
├── features/
│   └── dispatcher/
│       ├── index.ts              (NEW or update)
│       └── map-view.tsx          (NEW)
└── pages/
    └── dispatcher.tsx            (UPDATE)
```

---

## Constraints

- No npm packages for ymaps (script tag only)
- No `any` in TypeScript — use proper types from yandex-maps.d.ts
- Map must fill 100% of available space (not a fixed size)
- API key from `YANDEX_MAPS_API_KEY` constant only (never hardcoded)
- Loading/error states must be handled gracefully
- Map destroy on unmount to prevent memory leaks
- MVP only — no markers, zones, routes in this task (those are 7.1b, 7.1c, 7.1d)

---

## Dependencies

- FEAT-054 (API layer): done — provides useOrders, constants
- FEAT-053 (TopBar): done — dispatcher layout is ready
- No backend dependency

---

## Acceptance Criteria

1. MapView renders Yandex Map centered on Moscow at zoom 10
2. Map fills dispatcher main area completely (no fixed pixels)
3. Loading spinner shows while API loads
4. Error state shows if VITE_YANDEX_MAPS_API_KEY is empty
5. Map is destroyed on component unmount (no memory leak)
6. TypeScript compiles without errors (strict mode)
7. dispatcher.tsx imports MapView instead of using placeholder
