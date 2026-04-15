id: FEAT-001-v1-msg-001
from: orchestrator
to: backend-implementer
type: task

## Topic
Task 0.1 — Git & repository setup

## Feature
FEAT-001 v1

## Task
Initialize the Logistics Center repository and prepare the project root for the runtime-managed bootstrap sequence.

Required work:
1. Initialize git at `C:\logistics center\`
2. Create the root `.gitignore`
3. Create the root `README.md`
4. Keep `CLAUDE.md` and `documentation/` in the repository root structure
5. Prepare the workspace for the next bootstrap tasks (`0.2`, `0.3`, `0.4`)

## Constraints
- Repository/bootstrap scope only — no backend or frontend feature work yet
- Do not commit secrets
- Preserve `.claude/agent-runtime/` structure for orchestrator-managed workflows

## Output
After completion, write your summary report to:
`C:\logistics center\.claude\agent-runtime\outputs\FEAT-001-v1-backend.md`

## Deadline
immediate
