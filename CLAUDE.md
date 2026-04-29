# CLAUDE.md — Logistics Center

## 1. Контекст

**Logistics Center** — SaaS для управления собственной доставкой: заказы, маршруты, курьеры, смены, выплаты, мониторинг.
Главный пользователь MVP — **диспетчер / логист**. Главный экран — **карта**, а не таблица.
Целевая аудитория: компании с собственной доставкой, примерно 5–50 курьеров и 20–500 заказов в день.
**ОБЯЗАТЕЛЬНО:** код, имена файлов, переменные, комментарии в коде, commits и PR — на английском. Бизнес-документация может быть на русском.

## 2. Главные правила

1. **НЕ ЛОМАЙ РАБОТАЮЩЕЕ.**
2. Сначала читай существующий код, потом меняй.
3. Делай минимальный patch; не переписывай модуль без причины.
4. Для крупных задач сначала план, потом реализация.
5. После правки проверяй build/lint/tests, если доступны.
6. Не меняй архитектуру без явной необходимости.
7. Если сомневаешься — выбирай самое безопасное действие.

## 3. Стек

Backend: Node.js, NestJS, TypeScript, Prisma, PostgreSQL, Socket.io, Bull/queues, Swagger.
Frontend: React/TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, Yandex Maps JS API.
**ВАЖНО:** не мигрируй проект между Vite / Next.js / React Router без отдельной задачи. Работай в текущей структуре репозитория.

## 4. Backend architecture

* Backend — **модульный монолит**, не микросервисы.
* Один домен = один NestJS module.
* Controllers только принимают request и возвращают response.
* Business logic только в services.
* Доступ к DB только через service/repository layer.
* REST API versioning: `/api/v1/...`.
* Response envelope: `{ "data": {}, "meta": { "requestId": "...", "timestamp": "..." } }`.
* Error format: `{ "statusCode": 400, "message": "...", "error": "Bad Request", "requestId": "..." }`.

## 5. Multi-tenant isolation

**КРИТИЧНО:** все данные компании изолируются через `company_id`.
Правила:

* `companyId` брать только из JWT/auth context.
* Никогда не брать `companyId` из body/query params.
* Все DB-запросы фильтровать по `company_id`.
* Нельзя делать Prisma-запрос без tenant-фильтра.
* Новая service/repository function должна явно принимать `companyId`.
* `TenantGuard` должен проверять `req.user.companyId`.

Правильно:

```typescript
ordersService.findAll({ companyId: req.user.companyId, ...filters })
```

Неправильно:

```typescript
prisma.order.findMany()
```

## 6. Security / RBAC

Роли MVP: `admin`, `dispatcher`, `courier`.

* Auth через JWT access token + refresh token в httpOnly cookie.
* Password hashing — bcrypt.
* Public endpoints — rate limiting.
* Все DTO валидируются через class-validator.
* Frontend permission checks — только UX.
* Backend Guards — единственный источник истины.
* Не hardcode роли в `if/switch`; permissions должны быть data-driven.
  Guard pattern: `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` + `@RequirePermission('edit:payment-rules')`.

## 7. Домены

* `auth` — login, JWT, refresh tokens
* `users` — пользователи, роли, permissions
* `companies` — tenant management
* `orders` — заказы, статусы, история
* `routing` — маршруты, route points, построение маршрутов
* `couriers` — курьеры, статусы, GPS
* `dispatchers` — диспетчеры
* `zones` — геозоны
* `schedules` — смены
* `compensation` — мотивация и выплаты
* `integrations` — CRM API, webhooks, external IDs
* `notifications` — web/push уведомления
* `audit` — журнал критических действий
* `ai` — optional / Phase 2 only

## 8. State machines

Invalid transitions должны выбрасывать typed exception и логироваться в audit/history.
Order:

```text
new → confirmed → assigned → handed_over → in_transit
                                                ↓
                                    delivered / undelivered / returned / cancelled
```

Route: `draft → planned → in_progress → completed / cancelled`
Shift: `scheduled → confirmed → active → completed / no_show / cancelled`
Payment: `draft → calculated → approved → paid → disputed`; recalculated returns to calculated.
Правила:

* Каждый domain service со статусами имеет `canTransition(from, to)`.
* Статус нельзя менять напрямую без проверки.
* Каждый переход пишется в audit/history.

## 9. Routing abstraction

`routing` не должен напрямую зависеть от Yandex.
Интерфейс:

```typescript
interface RoutingProvider {
  buildRoute(points: RoutePoint[], options: RouteOptions): Promise<RouteResult>;
  calculateDistance(from: Coordinates, to: Coordinates): Promise<DistanceResult>;
  geocode(address: string): Promise<Coordinates>;
}
```

Правила:

* `routing.service.ts` зависит от `RoutingProvider`, не от `YandexRoutingProvider`.
* Yandex API key, base URL и детали API держать внутри provider.
* Замена провайдера = новый provider file + module binding, без переписывания domain logic.

## 10. Карта — центр UX

**ОБЯЗАТЕЛЬНО:** dispatcher UI строится вокруг карты.
На карте: заказы, маршруты, геозоны, курьеры при включённом слое, фильтры по дате/статусу/временному интервалу.
Основной flow: выбрать дату → отфильтровать заказы → выбрать заказы → построить маршрут → отредактировать → назначить курьера → сохранить или передать в мониторинг.
UX-правила:

* Не превращать интерфейс в CRM.
* Не прятать важные данные за лишними кликами.
* Диспетчер должен быстро видеть проблему и действовать.
* Для dispatcher UI важны скорость, плотность данных и map-first подход.

## 11. Frontend rules

* Server state — только TanStack Query.
* Zustand — только UI state: панели, фильтры, выделение.
* Не клади заказы, маршруты и курьеров в Zustand как источник истины.
* API logic выносить в hooks: `useOrders`, `useRoutes`, `useCouriers`.
* Components — functional only.
* Permission-based nav items не скрывать CSS-ом, а не рендерить.
* Unauthorized page access должен редиректить на подходящий fallback.
* После mutations инвалидируй TanStack Query cache.

## 12. Data rules

Все таблицы, кроме `companies`, должны иметь: `id`, `company_id`, `created_at`, `updated_at`.
Никогда физически не удалять: `payments`, `payment_recalculations`, `payment_rule_versions`, `audit_logs`, `integration_events`, историю статусов заказов.
Для `routes` использовать soft delete через `deleted_at`.
Фильтр `deleted_at IS NULL` должен быть в repository layer, не на совести caller.

## 13. Integrations

Inbound CRM API:

* требует `Idempotency-Key`;
* duplicate request с тем же ключом возвращает cached response;
* external CRM IDs мапятся на internal UUID;
* invalid payload отклоняется с подробной ошибкой.
  Outbound webhooks:
* signature: `X-Webhook-Signature: HMAC-SHA256`;
* retry: `30s → 2m → 10m → 30m → 2h`;
* failed events хранить в `integration_events`;
* нужна возможность manual retrigger.
  Никогда не отдавать internal UUID в CRM без mapping layer.

## 14. Observability

* В production code не использовать `console.log`.
* Использовать structured logger.
* В каждом логе: `timestamp`, `level`, `requestId`, `companyId`, `message`, `context`.
* Health endpoints: `GET /health`, `GET /health/ready`.
* Unhandled exceptions ловятся global exception filter.
* Audit log append-only и не удаляется даже admin.

## 15. AI module / feature flags

AI — optional enhancement, не core dependency.

* Core domains не зависят от `ai`.
* AI может слушать domain events.
* Core flow завершается даже если AI недоступен.
* AI recommendations сохраняются async.
* В MVP `ai` может быть placeholder.
  Опциональные и рискованные функции — через company-level feature flags.
  Правильно: `await featureFlagsService.isEnabled('ai-assistant', companyId)`.
  Неправильно: `process.env.NODE_ENV === 'production'` или `company.plan === 'premium'` в business logic.
  Flags хранятся в DB per company, проверка всегда async, optional features выключены по умолчанию.

## 16. Миграции и тесты

Миграции:

* Все DB schema changes — только Prisma migrations.
* Не применять manual SQL к shared/production DB.
* Migration file коммитится вместе с кодом.
* Не редактировать уже применённую миграцию.
* Destructive migration требует review и rollback plan.
  Тесты:
* Backend: services, API, tenant isolation, RBAC, state transitions, payment calculation.
* Frontend: hooks, utils, ключевые components.
* Test file рядом с source; один spec file на module/component.

## 17. Multi-agent workflow

Если используется `.claude/agent-runtime/`, соблюдай границы:

* `orchestrator` — создаёт `FEAT-XXX`, меняет pipeline state, пишет в `state/` и `messages/`.
* `planner` — только plan, без кода.
* `backend-implementer` — backend code + summary.
* `frontend-implementer` — frontend code + summary.
* `operations-ux-reviewer` — UX review, без кода.
* `reviewer` — final technical review, без кода.
  Artifact naming: `FEAT-XXX-vN-<stage>.md`.
  Не перезаписывать старые artifacts. Каждый retry создаёт новую версию.

## 18. Частые грабли проекта

Карта / Yandex Maps:

* Если точки не видны, сначала проверь координаты заказов и API key.
* Не чини карту переписыванием всего компонента.
* Проверяй lifecycle: init, ready, cleanup, повторный render.
* Не создавай несколько экземпляров карты поверх друг друга.
  Frontend state:
* Не клади server data в Zustand.
* После mutations инвалидируй Query cache.
* Не ломай filters/selection при добавлении UI controls.
  Routing UI:
* Диспетчер может строить много маршрутов за день.
* Нужно видеть несколько маршрутов и быстро переключаться.
* Финальные маршруты уходят в monitoring, drafts остаются editable.
* Flow не должен быть «таблица → потом карта». Карта помогает выбирать и понимать заказы.
  Backend:
* Не обходи service layer ради быстрого Prisma-запроса.
* Не забывай `companyId`.
* Не меняй state без audit/history.
* Не делай physical delete там, где нужен append-only или soft delete.
  Git:
* Перед рискованной правкой проверь `git status`.
* Не смешивай unrelated changes в одном feature.
* Не оставляй большие изменения без commit.

## 19. Никогда не делай

* Не превращай dispatcher UI в CRM.
* Не используй `any` в TypeScript.
* Не коммить `.env` или secrets.
* Не бери `companyId` из body/query.
* Не делай DB-запросы напрямую из controllers.
* Не hardcode role checks в `if/switch`.
* Не делай AI обязательным для core flow.
* Не hardcode Yandex внутри domain service.
* Не выпускай optional features без feature flag.
* Не скрывай forbidden UI через CSS.
* Не применяй manual SQL к production/shared DB.
* Не перезаписывай runtime artifacts.
* Не создавай Feature IDs никем, кроме orchestrator.

**ГЛАВНЫЙ ПРИОРИТЕТ:** сохранить рабочий проект, multi-tenant безопасность и map-first UX диспетчера.
