id: msg-<unique-id>
from: <agent-name>
to: <agent-name>
type: assignment | handoff | review-request | result

## Topic
<краткое описание задачи>

## Context
<контекст задачи: что происходит, откуда пришла задача>

## Input Artifacts
- agent-runtime/shared/<file>.md
- agent-runtime/outputs/<file>.md

## Task
<что нужно сделать следующему агенту>

## Expected Output
<какой результат ожидается>

## Output Location
agent-runtime/outputs/<file-name>.md

## Shared Updates
agent-runtime/shared/<file-name>.md

## Constraints
- Follow CLAUDE.md
- Stay within MVP scope
- Respect multi-tenant rules
- No overengineering

## Notes
<важные уточнения>

## Deadline
immediate