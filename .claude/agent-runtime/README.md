# Agent Runtime

Рабочая директория для субагентов проекта **Logistics Center**.

Эта папка используется для координации работы агентов, передачи артефактов между ними, хранения промежуточных данных, финальных результатов и состояния пайплайна.

## Структура

### `shared/`
Промежуточные артефакты между агентами.

Используется для:
- планов реализации
- промежуточных спецификаций
- handoff-контекста
- UX-заметок
- API-контрактов
- extracted context для следующего агента

Примеры:
- `shared/orders-feature-plan.md`
- `shared/orders-api-contract.md`
- `shared/dispatcher-map-ux-context.md`

---

### `outputs/`
Финальные результаты работы агентов.

Используется для:
- итоговых review-отчётов
- UX review
- backend/frontend implementation summaries
- финальных спецификаций по задаче

Примеры:
- `outputs/orders-backend-review.md`
- `outputs/orders-ux-review.md`
- `outputs/orders-feature-summary.md`

---

### `state/`
Состояние текущего pipeline.

Используется для:
- tracking текущей задачи
- статуса этапов
- текущего активного агента
- прогресса по feature workflow

Примеры:
- `state/pipeline-status.json`
- `state/orders-feature-state.json`

---

### `messages/`
Handoff-сообщения между агентами.

Используется для:
- передачи задания следующему агенту
- фиксации входных артефактов
- определения ожидаемого результата
- маршрутизации внутри агентной цепочки

Примеры:
- `messages/msg-001-planner-to-backend.md`
- `messages/msg-002-frontend-to-ux.md`
- `messages/msg-003-review-request.md`

---

## Как это работает

Агенты в проекте работают не изолированно, а как координируемая система.

Типичный workflow:

1. `orchestrator` определяет маршрут выполнения
2. `planner` создаёт план и сохраняет его в `shared/`
3. `backend-implementer` или `frontend-implementer` читают артефакты из `shared/`
4. результаты работы сохраняются в `outputs/`
5. `operations-ux-reviewer` и/или `reviewer` делают проверку
6. статус пайплайна обновляется в `state/`
7. handoff между агентами фиксируется в `messages/`

---

## Правила использования

- `shared/` — только промежуточные и передаваемые данные
- `outputs/` — только итоговые результаты работы агента
- `state/` — только статус выполнения и tracking pipeline
- `messages/` — только handoff и assignment между агентами
- не смешивать финальные результаты с промежуточными файлами
- использовать понятные и стабильные имена файлов
- для каждой крупной задачи сохранять отдельные артефакты
- структура должна оставаться читаемой для человека и агентов

---

## Naming conventions

### Shared artifacts
```text
<feature>-plan.md
<feature>-api-contract.md
<feature>-ux-context.md
<feature>-schema-notes.md


Output artifacts
<feature>-backend-review.md
<feature>-ux-review.md
<feature>-summary.md
<feature>-implementation.md
Messages
msg-001-planner-to-backend.md
msg-002-backend-to-reviewer.md
msg-003-frontend-to-ux.md
State files
pipeline-status.json
<feature>-state.json
Основные агенты проекта
orchestrator — координация и маршрутизация задач
planner — планирование реализации
backend-implementer — backend реализация
frontend-implementer — frontend реализация
operations-ux-reviewer — UX review операционного интерфейса
reviewer — техническое review и контроль качества
Цель runtime-слоя

Цель этой структуры — сделать работу агентов:

воспроизводимой
прозрачной
последовательной
пригодной для сложных multi-step задач

Это не просто временные файлы, а операционная среда агентной системы проекта.