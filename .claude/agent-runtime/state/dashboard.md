# Дашборд агентного runtime

Обновлено: 19:55 15.4.2026

---

## Декомпозиция задач по фазам

### Phase 0 — Bootstrap проекта

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 0.1 | Git & репозиторий | backend-implementer | завершена | — | git init, .gitignore, README, перенос Documentation/, CLAUDE.md в корень, initial commit |
| 0.2 | Backend scaffold | backend-implementer | завершена | 0.1 | nest new, tsconfig strict, установка всех зависимостей (prisma, swagger, jwt, bull, pino и т.д.), .env.example, ESLint+Prettier |
| 0.3 | Docker + БД | backend-implementer | завершена | 0.1 | docker-compose.yml (PostgreSQL 16 + Redis), prisma init, DATABASE_URL |
| 0.4 | Frontend scaffold | frontend-implementer | завершена | 0.1 | Vite+React+TS, tailwind, shadcn/ui, zustand, tanstack-query, react-hook-form+zod, react-router, axios, socket.io-client, .env |
| 0.5 | Структура папок | backend-implementer | создана | 0.2, 0.4 | Создать полное дерево каталогов backend/src/modules/*, frontend/src/pages/*, и т.д. |

**Deliverable:** `npm run start:dev` (backend), `npm run dev` (frontend), БД подключается, пустое приложение запускается.

---

### Phase 1 — БД и инфраструктура

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 1.1 | Prisma-схема (все таблицы) | backend-implementer | создана | 0.3 | companies, users, couriers, dispatchers, zones, orders, order_status_history, routes, route_points, payment_rule_versions, payments, payment_recalculations, audit_logs, integrations, integration_events, company_features. Все с company_id, uuid, timestamps. Первая миграция |
| 1.2 | PrismaService + tenant isolation | backend-implementer | создана | 1.1 | prisma.service.ts (lifecycle), prisma.module.ts (global), автофильтрация по company_id |
| 1.3a | Exception filter | backend-implementer | создана | 0.2 | Глобальный фильтр, формат ответа по API conventions, requestId в ошибках |
| 1.3b | Request ID interceptor | backend-implementer | создана | 0.2 | Генерация/чтение X-Request-ID, прокидка в контекст, возврат в response header |
| 1.3c | Response envelope interceptor | backend-implementer | создана | 0.2 | Обёртка всех ответов в { data, meta: { requestId, timestamp } } |
| 1.3d | Validation pipe | backend-implementer | создана | 0.2 | Глобальный pipe на class-validator |
| 1.3e | Structured logging (Pino) | backend-implementer | создана | 0.2 | nestjs-pino, requestId, companyId, level, timestamp, context в каждой записи |
| 1.3f | Rate limiting | backend-implementer | создана | 0.2 | @nestjs/throttler глобально на публичные эндпоинты |
| 1.4 | Health endpoints | backend-implementer | создана | 1.2 | GET /health (liveness), GET /health/ready (DB + Redis check) |
| 1.5 | Event constants | backend-implementer | создана | 0.2 | events.constants.ts — все доменные события из CLAUDE.md §3 |
| 1.6 | Swagger setup | backend-implementer | создана | 0.2 | /api/docs, JWT auth support в Swagger UI |

**Deliverable:** Backend стартует, БД со всей схемой, health отвечает, Swagger UI, логи структурированные, requestId на всех запросах.

---

### Phase 2 — Auth и пользователи

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 2.1a | Auth controller | backend-implementer | создана | 1.2 | POST register, login, refresh, logout |
| 2.1b | Auth service | backend-implementer | создана | 1.2 | Хеширование пароля (bcrypt), валидация, генерация JWT (access 15min + refresh 30d в httpOnly cookie) |
| 2.1c | JWT + Refresh стратегии | backend-implementer | создана | 2.1b | passport-jwt стратегия (Bearer), refresh стратегия (cookie) |
| 2.1d | Auth DTOs | backend-implementer | создана | 0.2 | register.dto.ts, login.dto.ts с class-validator |
| 2.2a | JwtAuthGuard | backend-implementer | создана | 2.1c | Валидация JWT, прикрепление user к request |
| 2.2b | TenantGuard | backend-implementer | создана | 2.2a | Глобальная проверка req.user.companyId |
| 2.2c | RolesGuard | backend-implementer | создана | 2.2a | Проверка role по @Roles() декоратору |
| 2.2d | PermissionsGuard | backend-implementer | создана | 2.2a | Проверка permissions по @RequirePermission(), data-driven матрица |
| 2.3 | Users module | backend-implementer | создана | 2.2d | GET /me, GET / (list, admin), POST / (create, admin), PATCH /:id (update, admin). Всегда фильтр по companyId |
| 2.4 | Companies module | backend-implementer | создана | 1.2 | companies.service.ts — CRUD, feature flags. FeatureFlagsService.isEnabled(flag, companyId) |
| 2.5 | Декораторы | backend-implementer | создана | 0.2 | @CurrentUser(), @Roles(), @RequirePermission(), @Public() |

**Deliverable:** Полный auth flow (register → login → refresh → logout). RBAC работает. Tenant isolation.

---

### Phase 3 — Основные домены

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 3.1 | Zones module | backend-implementer | создана | 2.3 | CRUD зон (admin), GeoJSON polygon, color, base rate |
| 3.2a | Orders CRUD | backend-implementer | создана | 2.3 | POST, GET list (filters), GET /:id, PATCH /:id |
| 3.2b | Orders state machine | backend-implementer | создана | 3.2a | canTransition(), InvalidStateTransitionException, логирование в order_status_history + audit_logs |
| 3.2c | Orders events | backend-implementer | создана | 3.2b | Emit order.created, order.status-changed |
| 3.3a | Couriers CRUD | backend-implementer | создана | 2.3 | GET list, GET /:id, PATCH /:id/status (online/offline), PATCH /:id/location (GPS) |
| 3.3b | Couriers events | backend-implementer | создана | 3.3a | Emit courier.location-updated |
| 3.4a | RoutingProvider interface | backend-implementer | создана | 0.2 | routing-provider.interface.ts — buildRoute, calculateDistance, geocode |
| 3.4b | YandexRoutingProvider | backend-implementer | создана | 3.4a | Реализация через Yandex Maps API (или mock для dev) |
| 3.4c | Routing service + controller | backend-implementer | создана | 3.4b | POST /routes/build, GET /routes, GET /:id, PATCH /:id. State machine: draft → planned → in_progress → completed/cancelled |
| 3.4d | Routing events | backend-implementer | создана | 3.4c | Emit route.built, route.updated, route.cancelled |
| 3.5 | Audit module | backend-implementer | создана | 1.5 | audit.service.ts — подписка на доменные события, запись в audit_logs. GET /audit-logs (admin). Append-only |

**Deliverable:** Все CRUD работают. State machines валидируют переходы. Routing через Yandex/mock. Audit trail.

---

### Phase 4 — Бизнес-логика

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 4.1a | Payment rules CRUD | backend-implementer | создана | 3.1 | POST, GET list, PATCH (→ новая версия). Типы: zone rate, per-km, per-order, bonus, penalty, minimum guarantee. Версионирование |
| 4.1b | Payment calculation engine | backend-implementer | создана | 4.1a | POST /payments/calculate — применение всех active rules к маршрутам/заказам курьера. Append-only запись с JSON breakdown |
| 4.1c | Payments CRUD + state machine | backend-implementer | создана | 4.1b | GET /payments, GET /:id. State: draft → calculated → approved → paid → disputed. Events: payment.calculated, payment.approved |
| 4.2a | Inbound API (CRM → LC) | backend-implementer | создана | 3.2a | POST /integrations/orders. Idempotency-Key, external_id mapping, strict validation |
| 4.2b | Outbound webhooks (LC → CRM) | backend-implementer | создана | 3.2c | Регистрация webhooks, HMAC-SHA256 подпись, retry (30s→2m→10m→30m→2h, max 5). Bull queue. Лог в integration_events |
| 4.3 | Notifications module | backend-implementer | создана | 3.2c | Внутренние уведомления (web). Алерты: new order, status change, route change. Доставка через Socket.io |

**Deliverable:** Расчёт выплат end-to-end. CRM пушит заказы и получает webhooks. Уведомления через WS.

---

### Phase 5 — Real-time

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 5.1a | WebSocket gateway | backend-implementer | создана | 3.3b | Socket.io gateway, JWT auth, rooms per company (tenant isolation) |
| 5.1b | WS events | backend-implementer | создана | 5.1a | courier:location_updated, order:status_changed, route:updated, alert:new |
| 5.2 | Bull queues | backend-implementer | создана | 0.3 | webhook-delivery queue (retries), payment-calculation queue. Опционально Bull Board на /admin/queues |

**Deliverable:** GPS курьеров в реальном времени. Webhooks асинхронно с retry.

---

### Phase 6 — Frontend база

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 6.1 | Структура и конфиг | frontend-implementer | создана | 0.4 | Финальная структура src/ (api, components, features, hooks, store, pages, lib) |
| 6.2a | Login page | frontend-implementer | создана | 6.1 | Страница /login с формой |
| 6.2b | Register page | frontend-implementer | создана | 6.1 | Страница /register с формой |
| 6.2c | Auth store + interceptors | frontend-implementer | создана | 6.2a | Zustand store (token, user, role, permissions). Axios interceptor: Bearer, 401→refresh→retry |
| 6.2d | Protected routes | frontend-implementer | создана | 6.2c | ProtectedRoute wrapper, redirect для неавторизованных |
| 6.3a | Sidebar navigation | frontend-implementer | создана | 6.2d | Карта, Курьеры, Выплаты, Настройки — роль-based видимость |
| 6.3b | Top bar | frontend-implementer | создана | 6.3a | Date picker, search, alerts badge |
| 6.3c | usePermissions hook | frontend-implementer | создана | 6.2c | can('action') — условный рендер по правам |
| 6.4 | API layer (axios + TanStack Query) | frontend-implementer | создана | 6.2c | Axios client (baseURL, auth interceptor, requestId), TanStack Query provider, хуки: useOrders, useCouriers, useRoutes и т.д. |

**Deliverable:** Login/register работает. Layout с role-based навигацией. API-клиент настроен.

---

### Phase 7 — Dispatcher UI

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 7.1a | Yandex Maps интеграция | frontend-implementer | создана | 6.4 | Подключение Yandex Maps JS API, базовый рендер карты |
| 7.1b | Маркеры заказов | frontend-implementer | создана | 7.1a | Заказы как точки на карте, цвет по статусу, клик → подсветка в списке |
| 7.1c | Полигоны зон | frontend-implementer | создана | 7.1a | Зоны как цветные полигоны на карте |
| 7.1d | Слои (routes, couriers) | frontend-implementer | создана | 7.1a | Toggle-переключатели для маршрутов и курьеров |
| 7.1e | Список заказов (правая панель) | frontend-implementer | создана | 6.4 | Скроллируемый список, статус, адрес, time slot. Клик → подсветка на карте. Drag & drop назначение |
| 7.1f | Top bar (дата, поиск, фильтры) | frontend-implementer | создана | 6.3b | Date picker (по умолчанию сегодня), поиск по номеру/адресу, фильтр по статусу/слоту |
| 7.2a | Построение маршрутов | frontend-implementer | создана | 7.1b | Кнопка "Построить маршруты" → POST /routes/build, визуализация polyline |
| 7.2b | Редактирование маршрутов | frontend-implementer | создана | 7.2a | Drag-n-drop точек, добавление/удаление заказов из маршрута |
| 7.2c | Назначение маршрута курьеру | frontend-implementer | создана | 7.2a | Dropdown или drag-drop, индикатор статуса маршрута |
| 7.3a | Socket.io подключение | frontend-implementer | создана | 5.1b | Подключение при mount, JWT auth, подписка на события компании |
| 7.3b | Live-позиции курьеров | frontend-implementer | создана | 7.3a, 7.1d | Движущиеся маркеры курьеров на карте |
| 7.3c | Live-обновления заказов | frontend-implementer | создана | 7.3a | Автообновление списка и маркеров при смене статуса |
| 7.3d | Алерты (toast + badge) | frontend-implementer | создана | 7.3a | Тост-уведомления о новых заказах/изменениях |

**Deliverable:** Диспетчер видит заказы на карте, строит маршруты, назначает курьеров, видит live-позиции.

---

### Phase 8 — Остальные страницы

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 8.1a | Couriers — таблица/список | frontend-implementer | создана | 6.4 | Имя, статус (online/offline), кол-во заказов, локация. Цветовая кодировка |
| 8.1b | Couriers — детальная карточка | frontend-implementer | создана | 8.1a | Клик → статистика, toggle online/offline |
| 8.2a | Payment rules — конструктор | frontend-implementer | создана | 6.4 | Визуальные блоки [CONDITION] → [ACTION], типы правил, кнопка "Симулировать" |
| 8.2b | Payments — список и детали | frontend-implementer | создана | 8.2a | Таблица: курьер, период, сумма, статус, breakdown. Клик → детализация. Approve/dispute |
| 8.3 | User management (admin) | frontend-implementer | создана | 6.4 | Список пользователей с ролями, создание, редактирование, деактивация |
| 8.4 | Company settings (admin) | frontend-implementer | создана | 6.4 | Профиль компании, integration settings (API keys, webhook URLs), feature flags |

**Deliverable:** Все MVP-страницы функциональны. Админ управляет пользователями, правилами выплат, настройками.

---

### Phase 9 — Тесты

| Task ID | Название | Исполнитель | Статус | Зависит от | Описание |
|---------|----------|-------------|--------|------------|----------|
| 9.1a | Auth flow tests | backend-implementer | создана | 2.1b | register, login, refresh, token expiration |
| 9.1b | Tenant isolation tests | backend-implementer | создана | 1.2 | Cross-tenant data leak prevention (CRITICAL) |
| 9.1c | State machine tests | backend-implementer | создана | 3.2b, 3.4c, 4.1c | Order, route, payment — valid + invalid transitions |
| 9.1d | Payment calculation tests | backend-implementer | создана | 4.1b | Rule application, edge cases, rounding |
| 9.1e | RBAC tests | backend-implementer | создана | 2.2d | Permission checks для всех ролей |
| 9.1f | Integration API tests | backend-implementer | создана | 4.2a | Idempotency, external ID mapping, validation |
| 9.2a | Frontend auth tests | frontend-implementer | создана | 6.2c | Login, refresh, redirect |
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
| Phase 0 | 5 | 4 | 1 | 4/5 | в работе |
| Phase 1 | 11 | 11 | 0 | 0/11 | создана |
| Phase 2 | 11 | 11 | 0 | 0/11 | создана |
| Phase 3 | 11 | 11 | 0 | 0/11 | создана |
| Phase 4 | 6 | 6 | 0 | 0/6 | создана |
| Phase 5 | 3 | 3 | 0 | 0/3 | создана |
| Phase 6 | 9 | 0 | 9 | 0/9 | создана |
| Phase 7 | 13 | 0 | 13 | 0/13 | создана |
| Phase 8 | 6 | 0 | 6 | 0/6 | создана |
| Phase 9 | 10 | 6 | 4 | 0/10 | создана |
| Phase 10 | 3 | 2 | 1 | 0/3 | создана |
| **Итого** | **88** | **54** | **34** | **4/88** | — |

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
| FEAT-005 | health-endpoints-liveness-readiness | создана | планировщик | v1 | ожидает | 1.4 | продолжить: планировщик |
| FEAT-006 | phase-0-finalize-fix-reviewer-blockers | завершена | завершено | v1 | одобрено | — | — |

---

## Активные pipeline

★ — последняя активная фича (текущий фокус). Несколько pipeline могут идти параллельно.

| ★ | Feature ID | Текущий шаг | Статус | Версия | Результат |
|---|------------|-------------|--------|--------|-----------|
|   | FEAT-005 | планировщик | создана | v1 | ожидает |

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
