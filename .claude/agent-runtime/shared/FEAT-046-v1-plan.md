# FEAT-046 Plan

## Scope

Complete Phase 6.1 frontend structure and config:
- finalize the `src/` module layout (`api`, `components`, `features`, `hooks`, `store`, `pages`, `lib`)
- separate the router/bootstrap layer from the root app component
- add barrel exports for core frontend slices to keep imports consistent
- verify the frontend scaffold with TypeScript and ESLint

## Implementation Notes

- Keep `App.tsx` thin: providers only.
- Move route tree and lazy page loading into a dedicated router module under `pages`.
- Add shared entrypoints for `components` and `lib` so future tasks can import from stable module roots.
- Leave feature-specific business logic for later tasks; this step is about structure, not full screens.
