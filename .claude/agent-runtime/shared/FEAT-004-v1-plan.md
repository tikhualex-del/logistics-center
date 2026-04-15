# FEAT-004-v1 Plan: Frontend Scaffold

## Feature ID
FEAT-004

## Version
v1

## Mode
Direct (bootstrap task — scope is fully defined in dashboard Task 0.4)

## Objective
Create the frontend application scaffold for Logistics Center following CLAUDE.md Section 3 repository structure.

## Stack (per CLAUDE.md Section 2)
- Vite + React 18 + TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (UI state only)
- TanStack Query / React Query (server state)
- React Hook Form + Zod (forms)
- React Router v6 (routing)
- Axios (HTTP client)
- Socket.io-client (real-time)
- .env / .env.example files

## Directory Structure (per CLAUDE.md Section 3)
```
frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── features/          # Feature-sliced structure
│   ├── hooks/
│   ├── store/             # Zustand stores (UI state only)
│   ├── api/               # TanStack Query + axios client
│   └── lib/               # utils, constants
└── public/
```

## Implementation Steps
1. Initialize Vite project with React + TypeScript template in /frontend
2. Install and configure Tailwind CSS
3. Install and configure shadcn/ui
4. Install Zustand, TanStack Query, React Hook Form + Zod, React Router v6, Axios, Socket.io-client
5. Set up directory structure per CLAUDE.md
6. Configure axios client in src/api/ with base URL from env
7. Configure TanStack Query provider in main app
8. Configure React Router with basic route structure
9. Set up Zustand store skeleton for UI state
10. Create .env.example with required variables (VITE_API_URL, VITE_YANDEX_MAPS_API_KEY, VITE_WS_URL)
11. Create placeholder pages: Login, Dispatcher (map-first), 404
12. Configure TypeScript strict mode

## Constraints
- No Phase 2 features (mobile, AI, analytics dashboards)
- No business logic in this scaffold — structure only
- Follow CLAUDE.md code conventions strictly
- English for all code, comments, variable names
- No `any` in TypeScript
- Map page placeholder must reflect map-first UX principle (CLAUDE.md Section 21)

## Output
- /frontend directory with working Vite dev server
- agent-runtime/outputs/FEAT-004-v1-frontend.md (implementation summary)
