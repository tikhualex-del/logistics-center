id: FEAT-006-v1-msg-002
from: orchestrator
to: frontend-implementer
type: task

## Topic
phase-0 finalize: fix frontend reviewer blockers

## Feature
FEAT-006 / v1

## Context
Reviewer ran `approve with fixes` on task 0.4 (frontend scaffold). The fixes below are all frontend-related. No new features — fixes only.

## Required fixes

### Fix 1 — CRITICAL: Rollback TypeScript to 5.7.2
File: `frontend/package.json`
Change: `"typescript": "~6.0.2"` → `"typescript": "~5.7.2"`
Reason: TypeScript 6.x stable does not exist. This version will break the build.

### Fix 2 — CRITICAL: Rollback React from 19 to 18
File: `frontend/package.json`
Changes required:
- `"react": "^19.2.4"` → `"react": "^18.3.1"`
- `"react-dom": "^19.2.4"` → `"react-dom": "^18.3.1"`
- `"@types/react": "^19.2.14"` → `"@types/react": "^18.3.23"` (or similar ~18.x)
- `"@types/react-dom": "^19.2.3"` → `"@types/react-dom": "^18.3.7"` (or similar ~18.x)
Reason: CLAUDE.md §2 requires React 18. React 19 is not in scope.

Also check `@vitejs/plugin-react` version — if it pinned to React 19, downgrade to compatible version (^4.x supports React 18).

### Fix 3 — Fix Vite and lucide-react versions
File: `frontend/package.json`
- `"vite": "^8.0.4"` — Vite 8 does not exist. Change to `"vite": "^6.3.5"` (latest Vite 6.x stable)
- `"lucide-react": "^1.8.0"` — lucide-react 1.x does not exist. Change to `"lucide-react": "^0.475.0"` (latest 0.4xx stable)
- `"@vitejs/plugin-react"` — if currently `^6.x`, change to `"^4.4.1"` (latest compatible with Vite 6)

After version corrections, run `npm install` to install correct packages.

### Fix 4 — Add frontend/components.json for shadcn CLI
Create file `frontend/components.json` with the following content:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```
Reason: Without components.json, `npx shadcn add <component>` fails.

### Fix 5 — Remove frontend/.env if it exists
Check if `frontend/.env` exists in the working tree.
If it does: remove it (only `.env.example` should exist).
Also verify `frontend/.gitignore` (or root `.gitignore`) has `.env` listed.

## Constraints
- Do NOT touch `frontend/src/pages/`, `frontend/src/features/`, `frontend/src/components/` — phase-6 code stays as-is
- Do NOT add new features or pages
- Only fix the listed items

## Output artifact
Create: `agent-runtime/outputs/FEAT-006-v1-frontend.md`

Report must include:
- List of all files changed
- Confirmation that `npm install` ran without errors
- Final versions of key packages (react, typescript, vite, lucide-react)
- Any remaining warnings or risks

## Deadline
immediate
