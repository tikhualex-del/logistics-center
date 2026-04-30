# Дашборд агентного runtime

Обновлено: 29.4.2026 (ревизия плана Phase 11–13 после независимого аудита)

---

## Декомпозиция задач по фазам

### Phase 0 — Bootstrap проекта

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 0.1 | Git & репозиторий | backend-implementer | завершена | — | git init, .gitignore, README, перенос Documentation/, CLAUDE.md в корень, initial commit |
| 0.2 | Backend scaffold | backend-implementer | завершена | 0.1 | nest new, tsconfig strict, установка всех зависимостей (prisma, swagger, jwt, bull, pino и т.д.), .env.example, ESLint+Prettier |
| 0.3 | Docker + БД | backend-implementer | завершена | 0.1 | docker-compose.yml (PostgreSQL 16 + Redis), prisma init, DATABASE_URL |
| 0.4 | Frontend scaffold | frontend-implementer | завершена | 0.1 | Vite+React+TS, tailwind, shadcn/ui, zustand, tanstack-query, react-hook-form+zod, react-router, axios, socket.io-client, .env |
| 0.5 | Структура папок | backend-implementer | завершена | 0.2, 0.4 | Создать полное дерево каталогов backend/src/modules/*, frontend/src/pages/*, и т.д. |

**Deliverable:** `npm run start:dev` (backend), `npm run dev` (frontend), БД подключается, пустое приложение запускается.

---

### Phase 1 — БД и инфраструктура

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 1.1 | Prisma-схема (все таблицы) | backend-implementer | завершена | 0.3 | companies, users, couriers, dispatchers, zones, orders, order_status_history, routes, route_points, payment_rule_versions, payments, payment_recalculations, audit_logs, integrations, integration_events, company_features. Все с company_id, uuid, timestamps. Первая миграция |
| 1.2 | PrismaService + tenant isolation | backend-implementer | завершена | 1.1 | prisma.service.ts (lifecycle), prisma.module.ts (global), автофильтрация по company_id |
| 1.3a | Exception filter | backend-implementer | завершена | 0.2 | Глобальный фильтр, формат ответа по API conventions, requestId в ошибках |
| 1.3b | Request ID interceptor | backend-implementer | завершена | 0.2 | Генерация/чтение X-Request-ID, прокидка в контекст, возврат в response header |
| 1.3c | Response envelope interceptor | backend-implementer | завершена | 0.2 | Обёртка всех ответов в { data, meta: { requestId, timestamp } } |
| 1.3d | Validation pipe | backend-implementer | завершена | 0.2 | Глобальный pipe на class-validator |
| 1.3e | Structured logging (Pino) | backend-implementer | завершена | 0.2 | nestjs-pino, requestId, companyId, level, timestamp, context в каждой записи |
| 1.3f | Rate limiting | backend-implementer | завершена | 0.2 | @nestjs/throttler глобально на публичные эндпоинты |
| 1.4 | Health endpoints | backend-implementer | завершена | 1.2 | GET /health (liveness), GET /health/ready (DB + Redis check) |
| 1.5 | Event constants | backend-implementer | завершена | 0.2 | events.constants.ts — все доменные события из CLAUDE.md §3 |
| 1.6 | Swagger setup | backend-implementer | завершена | 0.2 | /api/docs, JWT auth support в Swagger UI |

**Deliverable:** Backend стартует, БД со всей схемой, health отвечает, Swagger UI, логи структурированные, requestId на всех запросах.

---

### Phase 2 — Auth и пользователи

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 2.1a | Auth controller | backend-implementer | завершена | 1.2 | POST register, login, refresh, logout |
| 2.1b | Auth service | backend-implementer | завершена | 1.2 | Хеширование пароля (bcrypt), валидация, генерация JWT (access 15min + refresh 30d в httpOnly cookie) |
| 2.1c | JWT + Refresh стратегии | backend-implementer | завершена | 2.1b | passport-jwt стратегия (Bearer), refresh стратегия (cookie) |
| 2.1d | Auth DTOs | backend-implementer | завершена | 0.2 | register.dto.ts, login.dto.ts с class-validator |
| 2.2a | JwtAuthGuard | backend-implementer | завершена | 2.1c | Валидация JWT, прикрепление user к request |
| 2.2b | TenantGuard | backend-implementer | завершена | 2.2a | Глобальная проверка req.user.companyId |
| 2.2c | RolesGuard | backend-implementer | завершена | 2.2a | Проверка role по @Roles() декоратору |
| 2.2d | PermissionsGuard | backend-implementer | завершена | 2.2a | Проверка permissions по @RequirePermission(), data-driven матрица |
| 2.3 | Users module | backend-implementer | завершена | 2.2d | GET /me, GET / (list, admin), POST / (create, admin), PATCH /:id (update, admin). Всегда фильтр по companyId |
| 2.4 | Companies module | backend-implementer | завершена | 1.2 | companies.service.ts — CRUD, feature flags. FeatureFlagsService.isEnabled(flag, companyId) |
| 2.5 | Декораторы | backend-implementer | завершена | 0.2 | @CurrentUser(), @Roles(), @RequirePermission(), @Public() |

**Deliverable:** Полный auth flow (register → login → refresh → logout). RBAC работает. Tenant isolation.

---

### Phase 3 — Основные домены

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 3.1 | Zones module | backend-implementer | завершена | 2.3 | CRUD зон (admin), GeoJSON polygon, color, base rate |
| 3.2a | Orders CRUD | backend-implementer | завершена | 2.3 | POST, GET list (filters), GET /:id, PATCH /:id |
| 3.2b | Orders state machine | backend-implementer | завершена | 3.2a | canTransition(), InvalidStateTransitionException, логирование в order_status_history + audit_logs |
| 3.2c | Orders events | backend-implementer | завершена | 3.2b | Emit order.created, order.status-changed |
| 3.3a | Couriers CRUD | backend-implementer | завершена | 2.3 | GET list, GET /:id, PATCH /:id/status (online/offline), PATCH /:id/location (GPS) |
| 3.3b | Couriers events | backend-implementer | завершена | 3.3a | Emit courier.location-updated |
| 3.4a | RoutingProvider interface | backend-implementer | завершена | 0.2 | routing-provider.interface.ts — buildRoute, calculateDistance, geocode |
| 3.4b | YandexRoutingProvider | backend-implementer | завершена | 3.4a | Реализация через Yandex Maps API (или mock для dev) |
| 3.4c | Routing service + controller | backend-implementer | завершена | 3.4b | POST /routes/build, GET /routes, GET /:id, PATCH /:id. State machine: draft → planned → in_progress → completed/cancelled |
| 3.4d | Routing events | backend-implementer | завершена | 3.4c | Emit route.built, route.updated, route.cancelled |
| 3.5 | Audit module | backend-implementer | завершена | 1.5 | audit.service.ts — подписка на доменные события, запись в audit_logs. GET /audit-logs (admin). Append-only |

**Deliverable:** Все CRUD работают. State machines валидируют переходы. Routing через Yandex/mock. Audit trail.

---

### Phase 4 — Бизнес-логика

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 4.1a | Payment rules CRUD | backend-implementer | завершена | 3.1 | POST, GET list, PATCH (→ новая версия). Типы: zone rate, per-km, per-order, bonus, penalty, minimum guarantee. Версионирование |
| 4.1b | Payment calculation engine | backend-implementer | завершена | 4.1a | POST /payments/calculate — применение всех active rules к маршрутам/заказам курьера. Append-only запись с JSON breakdown |
| 4.1c | Payments CRUD + state machine | backend-implementer | завершена | 4.1b | GET /payments, GET /:id. State: draft → calculated → approved → paid → disputed. Events: payment.calculated, payment.approved |
| 4.2a | Inbound API (CRM → LC) | backend-implementer | завершена | 3.2a | POST /integrations/orders. Idempotency-Key, external_id mapping, strict validation |
| 4.2b | Outbound webhooks (LC → CRM) | backend-implementer | завершена | 3.2c | Регистрация webhooks, HMAC-SHA256 подпись, retry (30s→2m→10m→30m→2h, max 5). Bull queue. Лог в integration_events |
| 4.3 | Notifications module | backend-implementer | завершена | 3.2c | Внутренние уведомления (web). Алерты: new order, status change, route change. Доставка через Socket.io |

**Deliverable:** Расчёт выплат end-to-end. CRM пушит заказы и получает webhooks. Уведомления через WS.

---

### Phase 5 — Real-time

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 5.1a | WebSocket gateway | backend-implementer | завершена | 3.3b | Socket.io gateway, JWT auth, rooms per company (tenant isolation) |
| 5.1b | WS events | backend-implementer | завершена | 5.1a | courier:location_updated, order:status_changed, route:updated, alert:new |
| 5.2 | Bull queues | backend-implementer | завершена | 0.3 | webhook-delivery queue (retries), payment-calculation queue. Опционально Bull Board на /admin/queues |

**Deliverable:** GPS курьеров в реальном времени. Webhooks асинхронно с retry.

---

### Phase 6 — Frontend база

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 6.1 | Структура и конфиг | frontend-implementer | завершена | 0.4 | Финальная структура src/ (api, components, features, hooks, store, pages, lib) |
| 6.2a | Login page | frontend-implementer | завершена | 6.1 | Страница /login с формой |
| 6.2b | Register page | frontend-implementer | завершена | 6.1 | Страница /register с формой |
| 6.2c | Auth store + interceptors | frontend-implementer | завершена | 6.2a | Zustand store (token, user, role, permissions). Axios interceptor: Bearer, 401→refresh→retry |
| 6.2d | Protected routes | frontend-implementer | завершена | 6.2c | ProtectedRoute wrapper, redirect для неавторизованных |
| 6.3a | Sidebar navigation | frontend-implementer | завершена | 6.2d | Карта, Курьеры, Выплаты, Настройки — роль-based видимость |
| 6.3b | Top bar | frontend-implementer | завершена | 6.3a | Date picker, search, alerts badge |
| 6.3c | usePermissions hook | frontend-implementer | завершена | 6.2c | can('action') — условный рендер по правам |
| 6.4 | API layer (axios + TanStack Query) | frontend-implementer | завершена | 6.2c | Axios client (baseURL, auth interceptor, requestId), TanStack Query provider, хуки: useOrders, useCouriers, useRoutes и т.д. |

**Deliverable:** Login/register работает. Layout с role-based навигацией. API-клиент настроен.

---

### Phase 7 — Dispatcher UI

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 7.1a | Yandex Maps интеграция | frontend-implementer | завершена | 6.4 | Подключение Yandex Maps JS API, базовый рендер карты |
| 7.1b | Маркеры заказов | frontend-implementer | завершена | 7.1a | Заказы как точки на карте, цвет по статусу, клик → подсветка в списке |
| 7.1c | Полигоны зон | frontend-implementer | завершена | 7.1a | Зоны как цветные полигоны на карте |
| 7.1d | Слои (routes, couriers) | frontend-implementer | завершена | 7.1a | Toggle-переключатели для маршрутов и курьеров |
| 7.1e | Список заказов (правая панель) | frontend-implementer | завершена | 6.4 | Скроллируемый список, статус, адрес, time slot. Клик → подсветка на карте. Drag & drop назначение |
| 7.1f | Top bar (дата, поиск, фильтры) | frontend-implementer | завершена | 6.3b | Date picker (по умолчанию сегодня), поиск по номеру/адресу, фильтр по статусу/слоту |
| 7.2a | Построение маршрутов | frontend-implementer | завершена | 7.1b | Кнопка "Построить маршруты" → POST /routes/build, визуализация polyline |
| 7.2b | Редактирование маршрутов | frontend-implementer | завершена | 7.2a | Drag-n-drop точек, добавление/удаление заказов из маршрута |
| 7.2c | Назначение маршрута курьеру | frontend-implementer | завершена | 7.2a | Dropdown или drag-drop, индикатор статуса маршрута |
| 7.3a | Socket.io подключение | frontend-implementer | завершена | 5.1b | Подключение при mount, JWT auth, подписка на события компании |
| 7.3b | Live-позиции курьеров | frontend-implementer | завершена | 7.3a, 7.1d | Движущиеся маркеры курьеров на карте |
| 7.3c | Live-обновления заказов | frontend-implementer | завершена | 7.3a | Автообновление списка и маркеров при смене статуса |
| 7.3d | Алерты (toast + badge) | frontend-implementer | завершена | 7.3a | Тост-уведомления о новых заказах/изменениях |

**Deliverable:** Диспетчер видит заказы на карте, строит маршруты, назначает курьеров, видит live-позиции.

---

### Phase 8 — Остальные страницы

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 8.1a | Couriers — таблица/список | frontend-implementer | завершена | 6.4 | Имя, статус (online/offline), кол-во заказов, локация. Цветовая кодировка |
| 8.1b | Couriers — детальная карточка | frontend-implementer | завершена | 8.1a | Клик → статистика, toggle online/offline |
| 8.2a | Payment rules — конструктор | frontend-implementer | завершена | 6.4 | Визуальные блоки [CONDITION] → [ACTION], типы правил, кнопка "Симулировать" |
| 8.2b | Payments — список и детали | frontend-implementer | завершена | 8.2a | Таблица: курьер, период, сумма, статус, breakdown. Клик → детализация. Approve/dispute |
| 8.3 | User management (admin) | frontend-implementer | завершена | 6.4 | Список пользователей с ролями, создание, редактирование, деактивация |
| 8.4 | Company settings (admin) | frontend-implementer | завершена | 6.4 | Профиль компании, integration settings (API keys, webhook URLs), feature flags |

**Deliverable:** Все MVP-страницы функциональны. Админ управляет пользователями, правилами выплат, настройками.

---

### Phase 9 — Тесты

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 9.1a | Auth flow tests | backend-implementer | завершена | 2.1b | register, login, refresh, token expiration |
| 9.1b | Tenant isolation tests | backend-implementer | завершена | 1.2 | Cross-tenant data leak prevention (CRITICAL) |
| 9.1c | State machine tests | backend-implementer | завершена | 3.2b, 3.4c, 4.1c | Order, route, payment — valid + invalid transitions |
| 9.1d | Payment calculation tests | backend-implementer | завершена | 4.1b | Rule application, edge cases, rounding |
| 9.1e | RBAC tests | backend-implementer | завершена | 2.2d | Permission checks для всех ролей |
| 9.1f | Integration API tests | backend-implementer | завершена | 4.2a | Idempotency, external ID mapping, validation |
| 9.2a | Frontend auth tests | frontend-implementer | завершена | 6.2c | Login, refresh, redirect |
| 9.2b | usePermissions tests | frontend-implementer | создана | 6.3c | Hook logic для всех ролей |
| 9.2c | Payment rules constructor tests | frontend-implementer | создана | 8.2a | Form logic, validation |
| 9.2d | Order status display tests | frontend-implementer | создана | 7.1b | Корректное отображение статусов |

**Deliverable:** Критические пути покрыты тестами. CI может запустить полный suite.

---

### Phase 10 — CI/CD и деплой

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 10.1 | GitHub Actions CI | backend-implementer | создана | 9.1a | ci.yml: lint + test + build на каждый push/PR |
| 10.2 | Railway setup | backend-implementer | создана | 10.1 | PostgreSQL, Redis, backend service, env vars. deploy-backend.yml |
| 10.3 | Vercel setup | frontend-implementer | создана | 10.1 | Frontend deploy, env vars. deploy-frontend.yml |

**Deliverable:** Push to main → автодеплой. Полный CI pipeline.

---

## Сводная статистика

| Фаза | Задач | Backend | Frontend | Выполнено | Статус |
|------|-------|---------|----------|-----------|--------|
| Phase 0 | 5 | 4 | 1 | 5/5 | завершена |
| Phase 1 | 11 | 11 | 0 | 11/11 | завершена |
| Phase 2 | 11 | 11 | 0 | 11/11 | завершена |
| Phase 3 | 11 | 11 | 0 | 11/11 | завершена |
| Phase 4 | 6 | 6 | 0 | 6/6 | завершена |
| Phase 5 | 3 | 3 | 0 | 3/3 | завершена |
| Phase 6 | 9 | 0 | 9 | 9/9 | завершена |
| Phase 7 | 13 | 0 | 13 | 13/13 | завершена |
| Phase 8 | 6 | 0 | 6 | 6/6 | завершена |
| Phase 9 | 10 | 6 | 4 | 7/10 | в работе |
| Phase 10 | 3 | 2 | 1 | 0/3 | создана |
| **Итого** | **88** | **54** | **34** | **82/88** | — |

---

## Граф зависимостей (фазы)

```
phase-0 ──→ phase-1 ──→ phase-2 ──→ phase-3 ──→ phase-4
                                        │            │
                                        ├──→ phase-5 │ (параллельно)
                                        │            │
phase-6 ◄── phase-2 ────────────────────┘            │
    │                                                 │
    ├──→ phase-7 ◄── phase-3 + phase-5               │
    │                                                 │
    └──→ phase-8 ◄── phase-4 ────────────────────────┘
              │
              └──→ phase-9 ──→ phase-10
```

---

## Обзор фич

| Feature ID | Название | Статус | Текущий шаг | Версия | Вердикт | Task IDs | Следующее действие |
|------------|----------|--------|-------------|--------|---------|----------|--------------------|
| FEAT-001 | git-and-repository-setup | завершена | завершено | v1 | одобрено | 0.1 | — |
| FEAT-002 | backend-scaffold | завершена | завершено | v1 | одобрено | 0.2 | — |
| FEAT-003 | docker-and-database-setup | завершена | завершено | v1 | одобрено | 0.3 | — |
| FEAT-004 | frontend-scaffold | завершена | завершено | v1 | одобрено | 0.4 | — |
| FEAT-005 | health-endpoints-liveness-readiness | завершена | завершено | v1 | одобрено | 1.4 | — |
| FEAT-006 | phase-0-finalize-fix-reviewer-blockers | завершена | завершено | v1 | одобрено | — | — |
| FEAT-007 | repository-structure | завершена | завершено | v1 | одобрено | 0.5 | — |
| FEAT-008 | prisma-schema-initial-migration | завершена | завершено | v1 | одобрено | 1.1 | — |
| FEAT-009 | prisma-service-tenant-isolation | завершена | завершено | v1 | одобрено | 1.2 | — |
| FEAT-010 | exception-filter-api-conventions | завершена | завершено | v1 | одобрено | 1.3a | — |
| FEAT-011 | request-id-interceptor-http-context | завершена | завершено | v1 | одобрено | 1.3b | — |
| FEAT-012 | response-envelope-success-meta | завершена | завершено | v1 | одобрено | 1.3c | — |
| FEAT-013 | app-validation-pipe-global-provider | завершена | завершено | v1 | одобрено | 1.3d | — |
| FEAT-014 | structured-logging-pino-context-fields | завершена | завершено | v1 | одобрено | 1.3e | — |
| FEAT-015 | global-throttler-guard-public-http | завершена | завершено | v1 | одобрено | 1.3f | — |
| FEAT-016 | domain-event-constants | завершена | завершено | v1 | одобрено | 1.5 | — |
| FEAT-017 | swagger-setup-jwt-ui | завершена | завершено | v1 | одобрено | 1.6 | — |
| FEAT-018 | auth-controller-register-login-refresh-logout | завершена | завершено | v1 | одобрено | 2.1a, 2.1b, 2.1c, 2.1d | — |
| FEAT-019 | jwt-auth-guard | завершена | завершено | v1 | одобрено | 2.2a | — |
| FEAT-020 | tenant-guard-global-validation | завершена | завершено | v1 | одобрено | 2.2b | — |
| FEAT-021 | roles-guard-role-metadata-enforcement | завершена | завершено | v1 | одобрено | 2.2c | — |
| FEAT-022 | permissions-guard-data-driven-matrix | завершена | завершено | v1 | одобрено | 2.2d | — |
| FEAT-023 | users-module-tenant-safe-crud | завершена | завершено | v1 | одобрено | 2.3 | — |
| FEAT-024 | companies-module-feature-flags | завершена | завершено | v1 | одобрено | 2.4 | — |
| FEAT-025 | auth-decorators-current-user-public | завершена | завершено | v1 | одобрено | 2.5 | — |
| FEAT-026 | zones-module-admin-crud | завершена | завершено | v1 | одобрено | 3.1 | — |
| FEAT-027 | orders-crud-tenant-safe-module | завершена | завершено | v1 | одобрено | 3.2a | — |
| FEAT-028 | orders-state-machine-transition-logging | завершена | завершено | v1 | одобрено | 3.2b | — |
| FEAT-029 | orders-domain-events-emission | завершена | завершено | v1 | одобрено | 3.2c | — |
| FEAT-030 | couriers-crud-status-location-module | завершена | завершено | v1 | одобрено | 3.3a | — |
| FEAT-031 | courier-location-events | завершена | завершено | v1 | одобрено | 3.3b | — |
| FEAT-032 | routing-provider-interface-contract | завершена | завершено | v1 | одобрено | 3.4a | — |
| FEAT-033 | yandex-routing-provider-with-dev-mock | завершена | завершено | v1 | одобрено | 3.4b | — |
| FEAT-034 | routing-service-controller-state-machine | завершена | завершено | v1 | одобрено | 3.4c | — |
| FEAT-035 | routing-domain-events-emission | завершена | завершено | v1 | одобрено | 3.4d | — |
| FEAT-036 | audit-module-event-subscribers-and-admin-log-list | завершена | завершено | v1 | одобрено | 3.5 | — |
| FEAT-037 | payment-rules-versioned-crud | завершена | завершено | v1 | одобрено | 4.1a | — |
| FEAT-038 | payment-calculation-engine-with-breakdown | завершена | завершено | v1 | одобрено | 4.1b | — |
| FEAT-039 | payments-state-machine | завершена | завершено | v1 | одобрено | 4.1c | — |
| FEAT-040 | integrations-inbound-orders | завершена | завершено | v1 | одобрено | 4.2a | — |
| FEAT-041 | integrations-outbound-webhooks | завершена | завершено | v1 | одобрено | 4.2b | — |
| FEAT-042 | notifications-websocket-module | завершена | завершено | v1 | одобрено | 4.3 | — |
| FEAT-043 | realtime-websocket-gateway | завершена | завершено | v1 | одобрено | 5.1a | — |
| FEAT-044 | realtime-domain-events-bridge | завершена | завершено | v1 | одобрено | 5.1b | — |
| FEAT-045 | bull-queues-infrastructure | завершена | завершено | v1 | одобрено | 5.2 | — |
| FEAT-046 | frontend-structure-and-config | завершена | завершено | v1 | одобрено | 6.1 | — |
| FEAT-047 | login-page-form | завершена | завершено | v1 | одобрено | 6.2a | — |
| FEAT-048 | register-page-form | завершена | завершено | v1 | одобрено | 6.2b | — |
| FEAT-049 | auth-store-axios-interceptors | завершена | завершено | v1 | одобрено | 6.2c | — |
| FEAT-050 | protected-routes-protectedroute-wrapper-with-auth-redirect | завершена | завершено | v1 | одобрено | 6.2d | — |
| FEAT-051 | use-permissions-hook-can-action-role-based-rendering | завершена | завершено | v1 | одобрено | 6.3c | — |
| FEAT-052 | sidebar-navigation-role-based-visibility | завершена | завершено | v1 | одобрено | 6.3a | — |
| FEAT-053 | top-bar-date-picker-search-alerts-badge | завершена | завершено | v1 | одобрено | 6.3b | — |
| FEAT-054 | api-layer-tanstack-query-hooks | завершена | завершено | v1 | одобрено | 6.4 | — |
| FEAT-055 | yandex-maps-integration-mapview-component | завершена | завершено | v1 | одобрено | 7.1a | — |
| FEAT-056 | dispatcher-order-list-panel | завершена | завершено | v1 | одобрено | 7.1e | — |
| FEAT-057 | dispatcher-top-bar-filters | завершена | завершено | v1 | одобрено | 7.1f | — |
| FEAT-058 | dispatcher-socket-connection | завершена | завершено | v1 | одобрено | 7.3a | — |
| FEAT-059 | dispatcher-order-markers | завершена | завершено | v1 | одобрено | 7.1b | — |
| FEAT-060 | dispatcher-zone-polygons | завершена | завершено | v1 | одобрено | 7.1c | — |
| FEAT-061 | dispatcher-route-courier-layer-toggles | завершена | завершено | v1 | одобрено | 7.1d | — |
| FEAT-062 | dispatcher-route-building | завершена | завершено | v1 | одобрено | 7.2a | — |
| FEAT-063 | dispatcher-route-editor | завершена | завершено | v1 | одобрено | 7.2b | — |
| FEAT-064 | dispatcher-route-courier-assignment | завершена | завершено | v1 | одобрено | 7.2c | — |
| FEAT-065 | dispatcher-live-courier-positions | завершена | завершено | v1 | одобрено | 7.3b | — |
| FEAT-066 | dispatcher-live-order-updates | завершена | завершено | v1 | одобрено | 7.3c | — |
| FEAT-067 | dispatcher-alert-toasts-badge | завершена | завершено | v1 | одобрено | 7.3d | — |
| FEAT-068 | couriers-list-page | завершена | завершено | v1 | одобрено | 8.1a | — |
| FEAT-069 | couriers-detail-card | завершена | завершено | v1 | одобрено | 8.1b | — |
| FEAT-070 | payment-rules-constructor | завершена | завершено | v1 | одобрено | 8.2a | — |
| FEAT-071 | payments-list-and-details | завершена | завершено | v1 | одобрено | 8.2b | — |
| FEAT-072 | user-management-admin | завершена | завершено | v1 | одобрено | 8.3 | — |
| FEAT-073 | company-settings-admin | завершена | завершено | v1 | одобрено | 8.4 | — |
| FEAT-074 | auth-flow-tests | завершена | завершено | v1 | одобрено | 9.1a | — |
| FEAT-075 | tenant-isolation-tests | завершена | завершено | v1 | одобрено | 9.1b | — |
| FEAT-076 | state-machine-tests | завершена | завершено | v1 | одобрено | 9.1c | — |
| FEAT-077 | payment-calculation-tests | завершена | завершено | v1 | одобрено | 9.1d | — |
| FEAT-078 | rbac-permission-tests | завершена | завершено | v1 | одобрено | 9.1e | — |
| FEAT-079 | integration-api-tests | завершена | завершено | v1 | одобрено | 9.1f | — |
| FEAT-080 | frontend-auth-tests | завершена | завершено | v1 | одобрено | 9.2a | — |

---

## Активные pipeline

★ — последняя активная фича (текущий фокус). Несколько pipeline могут идти параллельно.

| ★ | Feature ID | Текущий шаг | Статус | Версия | Результат |
|---|------------|-------------|--------|--------|-----------|
| — | — | — | простаивает | — | — |

---

## Статусы

- `created` — задача создана
- `in_progress` — в работе
- `done` — завершена
- `blocked` — заблокирована зависимостью
- `retry` — возвращена на доработку
- `rejected` — отклонена

---

## Шаги pipeline

- `planner` — планировщик
- `backend-implementer` — backend-разработчик
- `frontend-implementer` — frontend-разработчик
- `operations-ux-reviewer` — UX-ревьюер
- `reviewer` — финальный ревьюер
- `completed` — pipeline завершён

---

## Аудит 28.4.2026 — состояние и следующие шаги

### Резюме

Канонический стек по [CLAUDE.md](../../../CLAUDE.md) (NestJS backend + Vite/React frontend) реализован полно и качественно: 13 доменных модулей, 56 test suites / 279 backend-тестов passing, strict TypeScript без ошибок, multi-tenant isolation через `runWithTenant`, state machines, RoutingProvider abstraction, append-only audit/payments, JWT+refresh+httpOnly cookie, Pino structured logging, Swagger UI, Prisma migrations с полной схемой по §9 CLAUDE.md. Frontend — TanStack Query + Zustand + shadcn/ui + Yandex Maps, dispatcher workspace с map-first UX, защищённые роуты с RBAC.

**Главный риск:** в репозитории живёт второй, нелегитимный стек `apps/api` (Express) + `apps/web` (Next.js), который противоречит §2 CLAUDE.md, и рутовый `package.json` запускает именно его. 139 незакоммиченных файлов в обеих ветках стека повышают вероятность потери работы.

### Что сделано хорошо (соответствует CLAUDE.md)

| Область | Статус | Файлы / маркеры |
|---|---|---|
| Modular monolith NestJS | ✅ | [backend/src/app.module.ts](../../../backend/src/app.module.ts) |
| 13 доменных модулей по §7 | ✅ | [backend/src/modules/](../../../backend/src/modules/) — auth, users, companies, orders, routing, couriers, zones, compensation, integrations, notifications, realtime, audit, health |
| Multi-tenant isolation | ✅ | [backend/src/prisma/tenant-context.service.ts](../../../backend/src/prisma/tenant-context.service.ts), `runWithTenant()` оборачивает все service-методы |
| Auth: JWT + refresh httpOnly cookie | ✅ | [backend/src/modules/auth/](../../../backend/src/modules/auth/) |
| RBAC data-driven | ✅ | [backend/src/modules/auth/permissions/permission-matrix.ts](../../../backend/src/modules/auth/permissions/permission-matrix.ts), `@RequirePermission` |
| State machines + audit | ✅ | order/route/payment-state-machine.ts, `audit_logs` append-only |
| RoutingProvider abstraction | ✅ | [backend/src/modules/routing/providers/](../../../backend/src/modules/routing/providers/) |
| Domain events constants | ✅ | [backend/src/common/events.constants.ts](../../../backend/src/common/events.constants.ts) |
| Response envelope + requestId + Pino | ✅ | [backend/src/common/](../../../backend/src/common/) |
| Prisma schema по §9 | ✅ | [backend/prisma/schema.prisma](../../../backend/prisma/schema.prisma), все таблицы с `company_id/created_at/updated_at` |
| Swagger `/api/docs` | ✅ | [backend/src/app.setup.ts](../../../backend/src/app.setup.ts) |
| Bull queues + Socket.io gateway | ✅ | [backend/src/modules/realtime/](../../../backend/src/modules/realtime/) |
| Backend тесты | ✅ | 56 suites / 279 tests passing, `tsc --noEmit` clean |
| Frontend стек по §2 | ✅ | [frontend/package.json](../../../frontend/package.json) — Vite/React/TanStack/Zustand/shadcn/Tailwind |
| Map-first dispatcher UI | ✅ | [frontend/src/features/dispatcher/](../../../frontend/src/features/dispatcher/) |
| Защищённые роуты с RBAC | ✅ | [frontend/src/pages/app-router.tsx](../../../frontend/src/pages/app-router.tsx) |
| Frontend тесты + ts-check | ✅ | 4 файла / 10 тестов passing, `tsc --noEmit` clean |

### Что плохо и надо переделать

| # | Проблема | Серьёзность | Нарушение CLAUDE.md |
|---|---|---|---|
| A1 | Параллельный `apps/api` на Express вместо NestJS | критично | §2 stack, §22 |
| A2 | Параллельный `apps/web` на Next.js вместо Vite/React | критично | §2 stack, §3 (запрет миграций между Vite/Next) |
| A3 | Рутовый `npm run dev` запускает `apps/api` + `apps/map`, а не канонический `backend` + `frontend` | критично | сбивает разработчика и CI |
| A4 | 139 незакоммиченных модифицированных файлов (M в обоих стеках) | высоко | §22 git, §17 «не оставляй большие изменения без commit» |
| A5 | Нет `.github/workflows/` — Phase 10 целиком открыта | средне | §19 CI/CD |
| A6 | Phase 9 frontend-тесты (9.2b/c/d) — только «создана», не реализованы | средне | §17 testing convention |
| A7 | Канонический frontend не содержит monitoring/SLA/alerts pages, которые есть в `apps/web` | средне | §10 «диспетчер видит проблему и действует» |
| A8 | Канонический frontend не имеет страницы создания заказа (есть только на `apps/web`) | средне | dispatcher должен быстро создавать заказ |
| A9 | В `frontend/src/features/orders/` пусто — нет orders UI вне карты | низко | UX полнота |
| A10 | Дубль prisma-схем (`apps/api/prisma/schema.prisma` ≠ `backend/prisma/schema.prisma`) — риск дрейфа | высоко | §10 migrations |
| A11 | Нет E2E smoke-теста на полный flow (login → order → route → assign) | средне | §17 |
| A12 | Sentry/error-tracking не подключён | низко | §14 observability |
| A13 | Stub-папки `ai/analytics/dispatchers/kpi/schedules` пустые (не блок — это Phase 2 placeholder, но нужно явно подтвердить и оставить README) | низко | §15, §18 phase 2 |

### План — декомпозиция следующих шагов

#### Phase 11 — Stack alignment & cleanup (priority 1, до любых новых фич)

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 11.8a | Pre-commit зелёный билд | backend-implementer | завершена | — | `cd backend && npm run lint && npx tsc --noEmit && npm test`. При красном — fix-up до коммита; если быстро не чинится — wip-ветка с пометкой в README. **Самый первый шаг.** |
| 11.8b | Коммит существующих изменений | backend-implementer | завершена | 11.8a | Серия коммитов по доменам: `chore(backend): commit pending common/...`, `chore(backend): commit pending modules/auth changes`, ... `chore(frontend): commit pending features/...`. 140 файлов: 94 backend + 27 frontend + 9 apps + 2 .claude |
| 11.3 | Архивная ветка `legacy/apps-stack` | backend-implementer | завершена | 11.8b | Создать ветку с текущим состоянием `apps/`, push в origin для истории |
| 11.1 | Аудит уникальной ценности `apps/web` | reviewer | завершена | 11.3 | Сравнить блоки `apps/web/src/components/{monitoring,sla,orders,users,integrations,routes,platform,ai,map}` с `frontend/src/features/*`. Отчёт: `.claude/agent-runtime/state/phase-11-11.1-apps-web-audit.md`. Все 7 уникальных блоков мигрировать/явно waived в 11.4: monitoring/SLA, orders detail+history+actions, routes management, map advanced, integrations расширенные, platform admin, AI chat primitives |
| 11.2 | Аудит `apps/api` vs `backend` | reviewer | завершена | 11.3 | Отчёт: `.claude/agent-runtime/state/phase-11-11.2-apps-api-audit.md`. `platform` и canonical `tenant-provisioning` мигрировать в 11.5; `access` не переносить отдельным модулем, только при необходимости встроить статусы в `users/auth` |
| 11.4a | Next.js → Vite адаптационный pattern | frontend-implementer | завершена | 11.1 | Чек-лист: `.claude/agent-runtime/state/phase-11-11.4a-next-vite-pattern.md`. Reference-pattern реализован в `frontend/src/features/monitoring/monitoring-shell.tsx`: без `'use client'`, `react-router-dom Link`, canonical hooks/TanStack Query, i18n вместо mojibake, статусы выровнены с backend |
| 11.4 | Миграция уникальных UI-фич из `apps/web` в `frontend/` | frontend-implementer | завершена | 11.4a | Отчёт: `.claude/agent-runtime/state/phase-11-11.4-ui-migration.md`. Перенесены monitoring route, SLA widgets, orders workspace/detail/create/actions/history, routes management, integrations webhook workspace, selected-order map overlay, AI assistant UI-only, navigation/routes. Waived: users covered by settings/UserManagement; platform real wiring ждёт 11.5; integration logs ждут backend endpoint |
| 11.5 | Миграция platform/super-admin из `apps/api` в backend | backend-implementer | завершена | 11.2 | Отчёт: `.claude/agent-runtime/state/phase-11-11.5-platform-backend-migration.md`. Добавлены `backend/src/modules/platform/` и `backend/src/modules/tenant-provisioning/`, Prisma migration для company metadata/platform admins/impersonation/audit, platform JWT + `PlatformGuard`, company CRUD/status/archive, seed-owner, tenant users visibility, platform admin CRUD, impersonation token/session flow. `access` не переносился; platform-доступ не использует tenant `permission-matrix.ts` |
| 11.6 | Удаление `apps/api`, `apps/web`, `apps/map` | backend-implementer | завершена | 11.3, 11.4, 11.5 | Отчёт: `.claude/agent-runtime/state/phase-11-11.6-remove-legacy-apps.md`. Удалены `apps/api`, `apps/web`, `apps/map`, untracked legacy artifacts (`apps/web/.next`, `node_modules`, build info) и пустой `apps/`. Дубли Prisma-схем удалены вместе с `apps/api/prisma`; единственный источник истины — `backend/prisma`. Root scripts остаются для 11.7 |
| 11.7 | Корневой `package.json` — scripts | backend-implementer | создана | 11.6 | Заменить scripts: `dev: concurrently npm:dev:backend npm:dev:frontend`, `dev:backend: cd backend && npm run start:dev`, `dev:frontend: cd frontend && npm run dev`. Корневые `lint`, `test`, `typecheck`, `build` проксируют в обе подпапки. Удалить `serve` и подобные dependency, оставшиеся от apps/map |
| 11.9 | Обновление `README.md` с инструкциями запуска | backend-implementer | создана | 11.7 | Чётко: `npm run dev` (root) → backend:3000 + frontend:5173, ссылки на `/api/docs`, `/health`, требования (Node, Postgres, Redis), env-файлы |
| 11.10 | Stub-модули MVP: явное решение | backend-implementer | создана | 11.7 | Реализовать минимальный `dispatchers` модуль (controller `GET /dispatchers` для assignment dropdown) — §7 CLAUDE.md требует в MVP. В `ai/`, `analytics/`, `kpi/` положить `README.md` с пометкой "Phase 2 placeholder by design" вместо `.gitkeep`. `schedules` модуль вынесен в Phase 12.8 |

**Deliverable:** Один канонический стек, рутовый `npm run dev` поднимает backend+frontend, все изменения закоммичены, `apps/api`/`apps/web`/`apps/map` удалены, README актуален, минимальный `dispatchers` модуль работает.

---

#### Phase 9 (доделать) — Frontend tests

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 9.2b | usePermissions tests | frontend-implementer | создана | 6.3c | Покрыть все три роли × ключевые permission-keys, edge: отсутствующий user, role unknown |
| 9.2c | Payment rules constructor tests | frontend-implementer | создана | 8.2a | Form-валидация Zod, добавление/удаление правил, симуляция расчёта (mock) |
| 9.2d | Order status display tests | frontend-implementer | создана | 7.1b | `order-status-badge` для каждого `OrderStatus`, цветовая кодировка, локализация |
| 9.2e | Dispatcher map smoke test | frontend-implementer | создана | 7.1a | Mock Yandex API, проверить рендер маркеров, кликов, фильтра по дате |
| 9.2f | Realtime hook tests | frontend-implementer | создана | 7.3a | `use-dispatcher-realtime` — mock socket, проверить invalidation TanStack Query при `order:status_changed` |
| 9.2g | Smoke-тесты мигрированных компонентов | frontend-implementer | создана | 11.4 | Минимальный render-тест для каждого мигрированного блока: order-detail-card, order-history-list, monitoring-shell, execution-summary, sla-status-badge, deadline-badge, users-table, change-role-modal, integrations create-form, platform companies-table, AI chat-input. Не покрывают логику — только smoke (mount без падений) |

**Deliverable:** Frontend coverage критических путей + smoke на мигрированном.

---

#### Phase 10 — CI/CD (priority 2, после 11)

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 10.1a | GitHub Actions: lint workflow | backend-implementer | создана | 11.7 | `.github/workflows/ci.yml` — eslint в backend и frontend параллельно |
| 10.1b | GitHub Actions: test workflow | backend-implementer | создана | 10.1a | jest backend + **vitest** frontend (явно указано), postgres+redis services с healthcheck перед прогоном интеграционных |
| 10.1c | GitHub Actions: build workflow | backend-implementer | создана | 10.1a | `nest build` + `vite build`, `tsc --noEmit` в обеих подпапках, артефакты в cache |
| 10.1d | Branch protection on main | backend-implementer | создана | 10.1c | Required checks: lint, test, build |
| 10.2a | Railway PostgreSQL + Redis | backend-implementer | создана | — | Добавить services в Railway-проекте, прокинуть `DATABASE_URL`, `REDIS_URL` |
| 10.2b | Railway backend deploy | backend-implementer | создана | 10.2a, 10.1c | `deploy-backend.yml` на push в main, release script: `prisma migrate deploy` → `node dist/main.js`. Проверить что миграции idempotent |
| 10.2c | Backend prod env-vars | backend-implementer | создана | 10.2a | JWT secrets, Yandex API key, CORS_ORIGIN, LOG_LEVEL, SENTRY_DSN, RATE_LIMIT_* |
| 10.2d | Idempotent staging seed | backend-implementer | создана | 10.2a | `npm run seed:staging` создаёт демо-компанию + admin/dispatcher/courier user'ов + 1 зону + несколько заказов. Идемпотентен (upsert по email/external-id), безопасен к повторному запуску |
| 10.3a | Vercel frontend project | frontend-implementer | создана | — | Подключить репозиторий к Vercel, выставить root → `frontend` |
| 10.3b | Vercel deploy + SPA fallback | frontend-implementer | создана | 10.3a, 10.1c | `vercel.json` с `rewrites: [{ source: "/(.*)", destination: "/" }]` для SPA fallback (иначе react-router 404 на refresh). Preview на PR. Опционально rewrite `/api/*` → `VITE_API_URL` |
| 10.3c | Frontend prod env-vars | frontend-implementer | создана | 10.3a | `VITE_API_URL`, `VITE_WS_URL`, `VITE_YANDEX_MAPS_API_KEY`, `VITE_SENTRY_DSN` |

**Deliverable:** Push в main → автодеплой обоих частей. PR требует зелёный CI.

---

#### Phase 12 — MVP gaps (priority 3, dispatcher productivity)

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 12.1 | Wire monitoring к live-обновлениям | frontend-implementer | создана | 11.4 | Mонитоring уже мигрирован в 11.4 (`monitoring-shell`, `execution-summary`, `courier-progress-panel`). Здесь — подключить к Socket.io: invalidate на `order:status_changed`, `route:updated`, `courier:location_updated`. Плотный лайв-экран, не CRM-таблица |
| 12.2 | Quick order create на карте | frontend-implementer | создана | 11.4 | Кнопка `+` на map-shell → modal: адрес (Yandex Geocoder), время, customer info. POST /orders, маркер появляется сразу. Без перехода на отдельную страницу. Учесть, что `create-order-form` уже мигрирован в 11.4 — здесь только встроить как модалку поверх карты |
| 12.3 | Drag-and-drop заказ → курьер | frontend-implementer | создана | 7.1e | На карте/в правой панели заказы можно перетащить на курьера в нижней панели. PATCH /orders/:id с `assignedCourierId`. Optimistic update |
| 12.4 | SLA-индикаторы на маркерах карты | frontend-implementer | создана | 12.1 | После 11.4 уже есть `sla-status-badge`, `deadline-badge`, `sla-summary-widget`. Здесь — встроить эти компоненты в layer заказов на карте: цвет маркера по SLA-уровню (green → yellow → red), считать клиентом из `time_window_to` |
| 12.5 | Notifications inbox панель | frontend-implementer | создана | 4.3 | Top-bar bell → выпадающий список последних 20 событий (создано/назначено/проблема). Read/unread state в Zustand |
| 12.6 | Smoke E2E (Playwright) | backend-implementer | создана | 11.7 | Один happy-path: register → login → create order → build route → assign courier → status change → payment calc. CI-friendly |
| 12.7 | Backend module: dispatchers (расширение) | backend-implementer | создана | 11.10 | Минимум уже создан в 11.10. Здесь расширить: dispatcher CRUD, привязка к зонам, статус online/offline. Без KPI |
| 12.8 | Schedules / смены MVP (опционально) | backend+frontend | обсуждается | 2.3 | §7 + §8 CLAUDE.md требуют `schedules` модуль с shift state machine: `scheduled → confirmed → active → completed/no_show/cancelled`. Backend: модуль + таблица `shifts` + state machine + canTransition. Frontend: страница смен с расписанием курьеров. **Решение о включении в MVP — за пользователем** (см. "Открытые вопросы") |

**Deliverable:** Диспетчер делает полный day-of-work без переключения экранов и таблиц.

---

#### Phase 13 — Production readiness

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 13.1 | Sentry backend | backend-implementer | создана | 10.2c | `@sentry/nestjs`, `SENTRY_DSN`, привязка к global exception filter, теги companyId/userId |
| 13.2 | Sentry frontend | frontend-implementer | создана | 10.3c | `@sentry/react`, source maps, теги пользователя |
| 13.3 | Production hardening | backend-implementer | создана | 10.2 | Усилить throttler-лимиты, CORS whitelist по env, JWT secrets из vault, проверить httpOnly+SameSite=lax |
| 13.4 | Staging deploy + smoke | backend-implementer | создана | 10.2, 10.3 | Развернуть staging-инстанс, прогнать E2E из 12.6, отметить gaps |
| 13.5 | Backup policy для Postgres | backend-implementer | создана | 10.2a | Railway daily snapshots + retention 7 дней; документировать процедуру restore |
| 13.6 | Health-check мониторинг | backend-implementer | создана | 1.4 | Подключить uptime-проверку (UptimeRobot/healthchecks.io) на `/health/ready` |
| 13.7 | Soft-delete cleanup job (опционально) | backend-implementer | обсуждается | 5.2 | Bull-задача / cron на физическое удаление `routes` с `deleted_at < now() - 90d`. Только для routes — payments/audit/integration_events остаются append-only навсегда. **Решение о включении — после первого пилота** |
| 13.8 | Audit log retention (опционально) | backend-implementer | обсуждается | 3.5 | `audit_logs` растёт линейно. Стратегия: партиционирование по месяцам или архивирование в S3 cold storage. **Решение — после первого пилота**, когда виден реальный rate записей |

**Deliverable:** Продакшн-установка готова к первому пилотному клиенту.

---

### Сводка нового плана (после ревизии 29.4.2026)

| Фаза | Задач | Backend | Frontend | Reviewer | Mixed | Статус |
|------|-------|---------|----------|----------|-------|--------|
| Phase 11 (cleanup) | 12 | 8 | 2 | 2 | 0 | создана |
| Phase 9 (доделать) | 6 | 0 | 6 | 0 | 0 | создана |
| Phase 10 (CI/CD) | 11 | 8 | 3 | 0 | 0 | создана |
| Phase 12 (MVP gaps) | 8 | 2 | 5 | 0 | 1 | создана |
| Phase 13 (prod) | 8 | 7 | 1 | 0 | 0 | создана (2 опц.) |
| **Итого новых** | **45** | **25** | **17** | **2** | **1** | — |

### Рекомендованный порядок исполнения (детализирован)

1. **11.8a** (зелёный билд backend: lint + tsc + test) — **самый первый шаг**, без него любой следующий рискует зафиксировать сломанный код.
2. **11.8b** (серия коммитов 140 файлов по доменам).
3. **11.3** (создать `legacy/apps-stack` ветку, push в origin).
4. **11.1 + 11.2** (детальная инвентаризация — параллельно reviewer-агентом).
5. **11.4a** (Next.js → Vite адаптационный pattern на одном компоненте).
6. **11.4** (миграция UI блоками: monitoring/sla/orders → routes/integrations/users → platform/AI).
7. **11.5** (миграция backend `platform`/`tenant-provisioning`, решение по `access`).
8. **11.6** (`git rm -r apps/api apps/web apps/map`, удалить пустую `apps/`).
9. **11.7 + 11.9** (root scripts + README).
10. **11.10** (stub-модули MVP: минимальный `dispatchers`, README в `ai/analytics/kpi`).
11. **9.2b–9.2g** (frontend tests, включая smoke на мигрированном).
12. **10.x** (CI/CD: lint → test → build → deploy).
13. **12.x** (MVP gaps; 12.8 schedules — отдельное решение).
14. **13.x** (production readiness; 13.7/13.8 — после первого пилота).

### Риски (после ревизии 29.4.2026)

- **R1.** Удаление `apps/web` без 11.4 потеряет UX-фичи (monitoring, SLA, order create, AI, platform) → 11.4 обязателен **до** 11.6. Все 7 уникальных блоков мигрируются (по решению пользователя).
- **R2.** 140 незакоммиченных файлов (94 backend / 27 frontend / 9 apps / 2 .claude) могут содержать сломанный код — 11.8a (зелёный билд) обязателен **до** 11.8b (коммита).
- **R3.** Дубль prisma-схем (`apps/api`: 91 строка vs `backend`: 484 строки) — единственный источник истины `backend/prisma/schema.prisma`. Удаление apps/api устраняет дубль.
- **R4.** Yandex API key в проде должен быть свой (не test-key) — задача в 10.2c.
- **R5.** Адаптация Next.js → Vite (директивы `'use client'`, `next/router`, `next/link`, `next/image`, server actions). Без 11.4a (reference-pattern) миграция блоков легко превратится в копи-пасту с runtime-ошибками.
- **R6.** §7 CLAUDE.md требует `dispatchers` и `schedules` модули в MVP, но обе папки сейчас содержат только `.gitkeep`. `dispatchers` минимум — в 11.10; `schedules` — Phase 12.8 (требует решения о включении в MVP).
- **R7.** AI-панель мигрируется как UI-only (backend `ai/` остаётся placeholder). До решения о backend-источнике (mock `/ai/chat` vs реальный GigaChat) панель будет неработоспособна — нужно либо отключать через feature flag, либо мокать.
- **R8.** Модуль `access` в apps/api может дублировать `auth` в backend. Окончательное решение (мигрировать или удалить) — по итогам 11.2.

### Открытые вопросы (требуют решения отдельно)

- **Phase 12.8 (schedules/смены)**: включаем в MVP или Phase 2? §7 CLAUDE.md требует, но это +backend-модуль и +UI.
- **Phase 13.7/13.8 (retention)**: делать сейчас или после первого пилота? Пока заморожены до пилота.
- **Backend для AI-панели**: mock `/ai/chat` или реальный GigaChat? Это отдельная Phase 2 задача.
- **`access` модуль**: судьба определяется по итогам 11.2.
