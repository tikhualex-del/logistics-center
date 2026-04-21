# CLAUDE.md

## Project Name

**Logistics Center**

## Project Vision

**Logistics Center** is a subscription-based SaaS platform for managing the full operational loop of a logistics department.

The system is intended to become a single workspace for:

* logistics leaders;
* dispatchers / logisticians;
* couriers;
* in the future, finance/operations roles and other supporting roles.

The product should cover the full logistics contour:

* intake of orders from external systems;
* planning and dispatching;
* route monitoring and execution;
* courier scheduling;
* courier payout calculation;
* KPI and motivation tracking;
* analytics for leadership;
* AI assistance for logisticians;
* future courier mobile application;
* secure user access and tenant isolation;
* integrations with CRM and return of data back to source systems.

---

## Product Goal

Build a secure, scalable, and operationally useful logistics SaaS from scratch, step by step, with clean architecture and clear boundaries between modules.

This project should be assembled correctly from the beginning:

* understandable architecture;
* safe authentication and authorization;
* multi-tenant isolation;
* reliable integrations;
* modular domain structure;
* incremental delivery;
* no rushed “magic” features before the operational core is stable.

---

## Product Summary

The platform has three main user groups.

### 1. Head of Logistics / Operations Manager

This role should be able to:

* view the whole logistics operation in one system;
* monitor couriers, logisticians, and routes;
* view analytics by courier, dispatcher, expenses, SLA, and performance;
* define KPI rules;
* track KPI completion;
* create motivation systems for couriers and logisticians;
* monitor operational efficiency and quality;
* understand where time and money are lost.

### 2. Logistician / Dispatcher

This role should be able to:

* receive and review incoming orders;
* build and manage routes;
* monitor route execution;
* schedule couriers;
* assign orders/couriers;
* track route progress and delivery issues;
* calculate courier payouts;
* use an AI assistant to support daily logistics work.

### 3. Courier (future mobile app)

This role should be able to:

* view assigned routes;
* follow scripts and instructions;
* confirm actions and statuses;
* see payout information;
* confirm payout-related data;
* work through the courier flow in a guided way.

---

## Core Product Principles

1. **Single operational workspace** — logisticians should not need multiple disconnected tools for core logistics work.
2. **Security first** — each company and each user must be isolated and protected.
3. **Multi-tenant by design** — every company works inside its own secure workspace.
4. **Incremental product build** — build module by module, not everything at once.
5. **Operational truth over flashy features** — first make dispatch, assignment, monitoring, and analytics stable; AI comes after the core is reliable.
6. **Integrations are essential** — the product must be able to receive data from external systems and send data back.
7. **Human-readable UX** — the product must be understandable for operations teams, not just developers.
8. **Beginner-friendly development process** — the system should be built step by step with clear explanations.

---

## Business Model

The product is a **subscription-based SaaS**.

Potential monetization model:

* monthly subscription per company;
* tiering by scale/features;
* optional limits by users/orders/couriers/routes;
* future premium modules (AI, advanced analytics, finance modules, integrations, mobile courier app, etc.).

---

## Main Product Areas

### A. Platform Foundation

* authentication;
* session management;
* user roles;
* company workspaces;
* multi-tenant data isolation;
* audit logging;
* basic settings;
* security and access control.

### B. Integrations Layer

* connection to CRM and external systems;
* inbound order import;
* data normalization;
* outbound data sync back to CRM;
* secure storage of credentials;
* integration diagnostics and health visibility.

### C. Operational Logistics Core

* order intake and processing;
* warehouse / hub model;
* courier management;
* route planning;
* assignment;
* route monitoring;
* dispatch workspace;
* schedule management;
* exceptions and operational states.

### D. Finance / Payouts Layer

* courier payout logic;
* payout calculation;
* payout confirmation;
* expense tracking;
* operational cost visibility.

### E. Analytics & Management Layer

* courier analytics;
* logistician analytics;
* expense analytics;
* SLA analytics;
* KPI tracking;
* motivation logic;
* management dashboards.

### F. AI Layer

* AI assistant for logisticians;
* future operational recommendations;
* future planning support;
* future anomaly/risk hints.

### G. Courier App (future phase)

* route view;
* scripts / guided flow;
* status confirmations;
* payout visibility;
* mobile-first execution.

---

## Initial Scope Strategy

This project should **not** be built all at once.

We will build it in layers.

### Phase 1 — Foundation

* project setup;
* architecture;
* auth;
* users/companies/roles;
* secure sessions;
* base app shell.

### Phase 2 — Operational Core MVP

* orders;
* basic logistics workspace;
* couriers;
* simple assignment;
* basic routes/dispatch;
* warehouse model.

### Phase 3 — Integration Layer

* CRM connection;
* inbound order sync;
* outbound sync back;
* diagnostics.

### Phase 4 — Analytics & Finance Foundation

* payout basics;
* basic dashboards;
* SLA and KPI metrics.

### Phase 5 — AI & Mobile Expansion

* AI assistant for logisticians;
* courier mobile app;
* advanced analytics and optimization.

---

## Development Approach

The project will be developed:

* from scratch;
* step by step;
* with ChatGPT and Claude as assistants;
* with the user as the project owner and learner.

Important context:

* the user is a **beginner in programming**;
* the system must be explained simply;
* every step should be safe and understandable;
* architecture decisions should be intentional and documented;
* code and modules should be built in a clean sequence.

### Working Rules

1. Do not jump ahead into complex features before the foundation is ready.
2. One module at a time.
3. Every module should have:

   * goal;
   * scope;
   * requirements;
   * acceptance criteria;
   * risks;
   * next step.
4. Prefer simple and robust solutions over overengineering.
5. Keep documentation updated as the project grows.
6. Explain technical steps in beginner-friendly language.

---

## Security Principles

The product must be designed with security in mind from the start.

### Required security principles

* strict company data isolation;
* secure authentication;
* protected sessions;
* role-based access control;
* safe handling of integration credentials;
* audit logging for important actions;
* protected APIs;
* no cross-tenant leakage;
* clear ownership of data.

---

## Initial Roles

Initial roles expected in the platform:

* **Owner / Admin** — manages company workspace;
* **Head of Logistics** — analytics, KPI, management oversight;
* **Dispatcher / Logistician** — dispatch and daily operations;
* **Courier** — future app/mobile execution;
* **Viewer / Analyst** — read-only access where needed.

---

## Long-Term Product Direction

In the long run, Logistics Center should become a full logistics operating system where:

* leadership sees the whole performance picture;
* dispatchers work inside one operational console;
* couriers execute through a guided mobile app;
* integrations bring and return data reliably;
* analytics and KPI systems drive accountability;
* AI supports but does not replace operational control.

---

## Current Starting Point

This is a **new project from zero**.

We are not reusing the old codebase as-is.
We are using previous learnings to build a cleaner and more correct system from the start.

The immediate next steps should be:

1. define architecture and stack;
2. define domain modules;
3. define initial folder structure;
4. define the first implementation phase;
5. then start coding step by step.

---

## Instruction for Future Work

When continuing this project:

* always respect the product vision above;
* prioritize clean architecture and safe development;
* avoid fake features and misleading UI;
* explain implementation in a beginner-friendly way;
* build the product incrementally;
* do not skip foundational decisions.


# 🚀 Logistics Center — Progress (Backend MVP v0.1)

## 📌 Текущий статус

Backend базово поднят и работает. Реализован первый модуль (companies) с полноценной интеграцией в базу данных через Prisma.

---

## 🧱 Инфраструктура

### Docker + DB

* PostgreSQL развернут через Docker
* Порт: 5433
* БД: logistics_center
* Данные сохраняются через volume

---

## 🧠 ORM и доступ к данным

### Prisma (v7)

* Используется новый формат:

  * prisma.config.ts
  * datasource вынесен из schema
* Prisma Client генерируется в:
  src/generated/prisma

Команды:

* npx prisma migrate dev
* npx prisma generate
* npx prisma studio

---

## 🗄️ Схема базы данных

### Модель: Company

Поля:

* id (uuid)
* name
* slug (unique)
* status
* timezone
* defaultCurrency
* language
* country
* contactEmail
* contactPhone
* planId
* createdAt
* updatedAt

Особенности:

* slug — уникальный индекс
* createdAt — default(now())
* updatedAt — auto update

---

## ⚙️ Backend архитектура

Структура:

apps/api/src/modules/companies/

* company.service.ts → работа с БД через Prisma
* company.controller.ts → HTTP слой (Express)
* company.routes.ts → роутинг

---

## 🔁 Реализованная логика

### Service слой (Prisma)

* getAll → prisma.company.findMany
* getById → prisma.company.findUnique
* create → prisma.company.create
* update → prisma.company.update

---

## ❗ Обработка ошибок

Реализовано:

* P2002 → duplicate slug
* P2025 → entity not found

---

## 🔄 Controller

* переведен на async/await
* обрабатывает ошибки через try/catch
* возвращает корректные HTTP ответы

---

## 🧪 Проверка

Проверено через:

* Prisma Studio
* Postman / curl

Результат:

* данные сохраняются в БД
* данные не теряются после перезапуска
* CRUD работает

---

## ⚠️ Важные технические решения

1. Prisma используется без repository слоя (упрощенная архитектура)
2. Без DI (dependency injection) на текущем этапе
3. Минимальный MVP без переусложнения
4. Код пишется через связку:

   * ChatGPT → архитектура и контроль
   * Claude → написание кода

---

## 🚨 Ограничения текущего этапа

* Нет валидации DTO (Joi/Zod)
* Нет middleware для ошибок
* Нет логирования
* Нет авторизации
* Нет транзакций
* Нет unit тестов

---

## 🎯 Следующий этап (вектор развития)

Backend нужно довести до production-ready уровня через:

1. Валидация входных данных
2. Централизованный error handler
3. Логирование
4. Расширение модулей (orders, couriers, logistics)
5. Подготовка к масштабированию

---

## 📊 Текущая стадия

👉 Backend MVP: 20–25% готовности
👉 Data layer: готов
👉 CRUD: готов
👉 Архитектура: базовая, контролируемая

---

## 📍 Вывод

Фундамент проекта готов:

* БД работает
* ORM подключен
* Первый модуль реализован правильно

Проект готов к дальнейшему развитию без технического долга.



Реализован полный контур работы с заказами:

ingestion (импорт)
хранение
геокодинг
отображение на карте
кластеризация
базовый UI (карточка заказа)

👉 Система впервые работает как операционный инструмент, а не просто API.

🧱 Новый доменный модуль
Orders

Статус: ✅ реализован (MVP уровень)

🗄️ Схема базы данных
Модель: Order

Поля:

id (uuid)
companyId (FK → Company)
externalId (optional)
status
deliveryDate (optional)
address
lat (optional)
lng (optional)
comment (optional)
createdAt
updatedAt

Связи:

Order → Company (many-to-one)
Company → orders[]

Индексы:

companyId
status
deliveryDate
⚙️ Backend архитектура (Orders)

Структура:

apps/api/src/modules/orders/

order.types.ts
order.validation.ts
order.service.ts
order.controller.ts
order.routes.ts
index.ts
🔁 Реализованная логика
CRUD
GET /orders
GET /orders/:id
POST /orders
PATCH /orders/:id
Фильтрация

Поддержка query:

companyId
status
deliveryDate

Реализовано через:

validateQuery middleware
динамический where в Prisma
🧪 Валидация

Статус: ✅ реализована

Подход:

кастомная validation layer
validate / validateParams / validateQuery

Проверки:

UUID
required fields
optional fields
unknown fields rejected (update)
типы данных (lat/lng)
📥 Импорт заказов
Endpoint

POST /orders/import

Статус: ✅ реализован

Возможности
batch insert (createMany)
частичный успех
агрегация ошибок с index
единая проверка companyId (одним запросом)
разделение:
errors (критические)
warnings (не блокируют)
🌍 Геокодинг

Статус: ✅ реализован

Файл:

src/lib/geocoding.ts

Логика
вызывается при import, если нет lat/lng
provider: Nominatim
delay между запросами (rate limit)
Map cache (in-memory)
fallback при ошибке
Поведение
успех → координаты сохраняются
ошибка → заказ создается без координат + warning
🗺️ Map API

Статус: ✅ реализован

Endpoints
GET /orders/map
GET /orders/map/cluster
getForMap
возвращает только заказы с координатами
select минимального набора полей
bbox фильтрация

Поддержка:

minLat / maxLat
minLng / maxLng

Валидация:

диапазоны координат
логическая проверка границ
обязательность всех 4 параметров
🧩 Кластеризация

Статус: ✅ реализована

Логика
grid-based clustering
grouping по:
floor(lat/gridSize), floor(lng/gridSize)
Типы объектов

Point:

id
lat/lng
status
deliveryDate

Cluster:

lat/lng (avg)
count
Динамика

gridSize зависит от zoom:

≥14 → 0.005
11–13 → 0.01
<11 → 0.05
🌐 Frontend (Map)

Статус: ✅ реализован (MVP)

Файл:

apps/map/index.html

Технология
Yandex Maps
Логика работы
boundschange → загрузка данных
debounce (300ms)
AbortController (race condition fix)
Рендер
point → Placemark (иконка)
cluster → Placemark (count)
UX поведение
клик по кластеру → zoom in
автоматический перерасчет кластеров
📦 Карточка заказа (Sidebar)

Статус: ✅ реализована

Поведение
клик по точке → открывается sidebar
GET /orders/:id
Отображаемые данные
id
status
address
deliveryDate
companyId
координаты
createdAt
Состояния
loading
success
error
empty
🔧 Решенные технические проблемы
1. CORS
добавлен cors middleware
2. Race conditions
AbortController
отмена предыдущих запросов
3. Performance карты
debounce
bbox фильтрация
кластеризация
4. Геокодинг ограничения
rate limit соблюден
кэширование
⚠️ Ограничения текущего этапа
нет couriers
нет assignment
нет routes
нет SLA
нет payout
нет auth
нет audit log
нет real integrations
📊 Текущая стадия

👉 Backend MVP: ~45–50%
👉 Orders domain: MVP готов
👉 Map: MVP готов
👉 First operational flow: готов



Couriers module — Backend CRUD foundation

Что сделано:

Создан backend-модуль couriers
Реализованы:
POST /couriers
GET /couriers
GET /couriers/:id
PATCH /couriers/:id
Добавлены validation schema для:
create
update
params
list query
Подключён couriers.routes в общее приложение
Реализована проверка существования company при создании courier
Реализована фильтрация списка курьеров по:
companyId
status
transportType

Принятые решения:

список курьеров всегда company-scoped
companyId обязателен в list и create
companyId нельзя менять через update
без pagination и search на текущем этапе



### 🚚 Couriers module — Backend CRUD foundation

**Что сделано:**

- Создан backend-модуль `couriers`
- Реализованы endpoints:
  - `POST /couriers`
  - `GET /couriers`
  - `GET /couriers/:id`
  - `PATCH /couriers/:id`
- Добавлены validation schema:
  - create courier
  - update courier
  - params (:id)
  - list query (с whitelist)
- Реализован строгий whitelist:
  - body (create/update)
  - query (list)
- Подключён `couriersRouter` в `app.ts`
- Реализована фильтрация:
  - по `companyId` (обязательный)
  - по `status`
  - по `transportType`
- Реализована обработка ошибок:
  - company not found (P2003)
  - courier not found (P2025)

**Принятые решения:**

- список курьеров всегда company-scoped
- `companyId` обязателен для list
- `companyId` нельзя менять через update
- отказ от enum на этом этапе (status/transportType как string)
- отказ от pagination/search (MVP-фокус)



Couriers module — Tenant-safe access by id

Что сделано:

Усилен доступ к GET /couriers/:id
Усилен доступ к PATCH /couriers/:id
Для id-based endpoints companyId теперь обязателен в query
Добавлена отдельная validation для query:
разрешён только companyId
unknown query params отклоняются
Получение courier по id теперь выполняется только в рамках своей company
Обновление courier по id теперь выполняется только в рамках своей company

Принятые решения:

tenant isolation реализован без auth, через companyId в query
выбран простой MVP-подход без tenant middleware
для update используется двухшаговая проверка:
сначала проверка принадлежности courier к company
затем обновление записи





### 🚚 Order assignment — Manual dispatch foundation

**Что сделано:**

- Добавлены endpoints:
  - `PATCH /orders/:id/assign`
  - `PATCH /orders/:id/unassign`
- Реализована ручная диспетчеризация заказов
- Добавлены validation:
  - assign (companyId + courierId)
  - unassign (companyId)
- Добавлен строгий whitelist для body
- Реализована tenant-safe логика:
  - order ищется по `id + companyId`
  - courier ищется по `courierId + companyId`
- Добавлено поле `courierId` в API-ответ order

**Принятые решения:**

- assignment вынесен в отдельные endpoints (а не в общий update)
- проверка принадлежности order и courier к одной company обязательна
- отказ от assignment history и статусов на этапе MVP
- простая двухшаговая проверка вместо сложных DB constraints








### 🗺️ Map API — Courier assignment visibility

**Что сделано:**

- В `/orders/map` добавлено поле `courierId`
- В `/orders/map/cluster` для `point` добавлено `courierId`
- Кластеры (`type: cluster`) не изменены
- Обеспечена поддержка:
  - назначенных заказов (`courierId != null`)
  - неназначенных заказов (`courierId = null`)

**Принятые решения:**

- передаётся только `courierId`, без объекта courier
- сохранён минимальный payload для карты
- дополнительная информация о курьере будет загружаться отдельно при необходимости



### ⚠️ Dev environment issue

**Проблема:**
- routes были добавлены, но сервер возвращал 404

**Причина:**
- ts-node-dev не перезапустил runtime корректно

**Решение:**
- полный рестарт node процесса
- очистка зависших процессов




### 🚀 Dev setup — unified start

**Что сделано:**

- добавлен единый запуск проекта через root package.json
- используется concurrently для запуска backend и frontend

**Команда запуска:**

npm run dev

**Результат:**

- backend → localhost:3000
- map → localhost:3001









## 🚀 Couriers + Dispatch + Map Integration (MVP v0.2)

### 📌 Что реализовано

#### 1. Couriers module
- создана сущность Courier
- CRUD:
  - create
  - get list (с фильтрами)
  - get by id (tenant-safe)
  - update (tenant-safe)
- strict validation + whitelist
- защита от межтенантного доступа

---

#### 2. Multi-tenant safety
- все операции с courier проверяют companyId
- невозможно:
  - получить чужого курьера
  - обновить чужого курьера
  - назначить чужого курьера на заказ

---

#### 3. Order ↔ Courier relation
- добавлен courierId в Order
- связь:
  - Order → Courier (optional)
- onDelete: SetNull

---

#### 4. Dispatch logic (core feature)
Реализованы endpoints:

- PATCH /orders/:id/assign
- PATCH /orders/:id/unassign

Логика:
- assign:
  - проверка order.companyId
  - проверка courier.companyId
  - назначение courierId
- unassign:
  - сброс courierId → null

---

#### 5. Map API улучшен
- /orders/map → добавлен courierId
- /orders/map/cluster → добавлен courierId
- payload оптимизирован (без лишних данных)

---

#### 6. Map UI (визуализация)
- цвет точки зависит от назначения:
  - 🔵 синий → без курьера
  - 🟢 зелёный → назначен курьер
- кластеризация работает
- debounce + abort controller

---

#### 7. Frontend integration
- исправлена обработка API ответа (`data`)
- исправлен CORS (serve + origin)
- устранены runtime ошибки

---

#### 8. Dev environment
- единый запуск через:
  npm run dev
- backend + frontend запускаются одновременно




### 🧍 Courier selection (UI foundation)

**Что сделано:**

- sidebar теперь загружает список курьеров
- используется endpoint:
  GET /couriers?companyId=...
- отображается базовая информация о курьере

**Цель:**
подготовка к assignment с карты



### 🚚 Order assignment (dispatch action)

**Что реализовано:**

- назначение курьера на заказ из UI
- используется endpoint:
  PATCH /orders/:id/assign

**Поведение:**

- после назначения карта обновляется
- точка меняет цвет (assigned)

**Бизнес-смысл:**

- реализован базовый dispatch workflow



### 🔁 Courier reassignment

**Что реализовано:**

- снятие курьера с заказа
- переназначение курьера
- UI отражает текущее состояние

**Endpoints:**

- PATCH /orders/:id/unassign
- PATCH /orders/:id/assign

**Поведение:**

- при unassign → courierId = null
- при assign → courierId обновляется



### 🎛️ Map filters (control layer)

**Что реализовано:**

- фильтр по статусу заказа
- фильтр по назначению (assigned/unassigned)

**Поведение:**

- фильтры применяются в реальном времени
- карта обновляется при изменении

**Бизнес-смысл:**

- логист может управлять потоком заказов



🧭 Workspace split — Orders vs Courier Monitoring

Что сделано:

Карта разделена на 2 operational views:
Заказы
Мониторинг курьеров
Текущая карта заказов оставлена в отдельной вкладке
Подготовлена отдельная вкладка для будущего мониторинга курьеров

Принятые решения:

заказы и курьеры разделены на разные рабочие поверхности
dispatch workflow не смешивается с courier monitoring
сначала создан UI foundation вкладок, без перегрузки логики


### 🧍 Courier map foundation

**Что сделано:**

- добавлены координаты (lat/lng) для courier
- подготовлена модель для отображения на карте

**Цель:**

- подготовка мониторинга курьеров



🧍 Courier map foundation

Что сделано:

В модель Courier добавлены координаты:
lat
lng
Обновлены create/update courier endpoints для поддержки координат
Обновлены validation rules для lat/lng
Применена миграция базы данных
Обновлён Prisma Client

Принятые решения:

координаты сделаны optional
без геокодинга и без realtime tracking на этом этапе
foundation подготовлен специально для вкладки Мониторинг курьеров



🧍 Courier Monitoring — Map view

Что сделано:

Во вкладке Мониторинг курьеров добавлена отдельная карта
Карта использует endpoint GET /couriers/map
Курьеры отображаются отдельными маркерами
Для курьеров используется отдельный визуальный стиль
Пустой результат не ломает вкладку мониторинга

Принятые решения:

карта курьеров отделена от карты заказов
мониторинг курьеров работает в отдельной operational view
используется отдельный state и отдельный map container
без clustering и realtime на текущем этапе


📍 Courier GPS foundation v1

Что сделано:

Модель Courier расширена tracking-полями:
lastLocationAt
locationSource
trackingStatus
Обновлены create/update courier endpoints
Новые поля возвращаются через courier API
Применена миграция базы данных
Обновлён Prisma Client

Принятые решения:

lat/lng оставлены без переименования на этом этапе
foundation подготовлен под будущую mobile GPS integration
без realtime, без history table и без location ingestion endpoint на текущем шаге





Название блока:
Tenant Access Foundation v1

Что сделано:
В проекте внедрён единый tenant context для company-scoped API. Источником tenant truth стал x-company-id header, который обрабатывается через tenant.middleware и сохраняется в req.tenantContext. Контроллеры orders и couriers переведены на использование requireTenantContext(req) как единственной точки получения companyId.

Принятые решения:

Company-scoped endpoints больше не принимают companyId из query/body/params как источник прав доступа.
Для service layer в orders и couriers companyId передаётся явным первым параметром.
Из validation и input contracts удалён внешний companyId для company-scoped операций.
Frontend map layer обновлён для передачи tenant header во все рабочие запросы.
Critical contour orders / couriers / map / assign / unassign полностью переведён на tenantContext.

Ограничения / next note:
Текущая реализация нормализует tenant access foundation, но ещё не является полноценной auth/access security model. Пока tenant identity определяется через x-company-id без user/session/membership/role validation. Platform-level endpoints модуля Companies остаются вне tenant contour и в будущем должны защищаться через отдельную access model для platform admin / super admin.



Audit Log Foundation v1 — Infrastructure Layer

Что сделано:
В проект добавлена foundation-инфраструктура для audit logging. В Prisma schema создана модель AuditLog с привязкой к Company, actor context, entity context, action, metadata и временной меткой создания. Для записи audit-событий добавлен отдельный service layer, а для получения actor context из request headers — отдельный helper.

Принятые решения:

Источником Prisma types для audit module выбран generated client entry point src/generated/prisma/client.
Для JSON-поля metadata использована типизация, совместимая с Prisma create input для nullable JSON.
Audit infrastructure пока не подключена ко всем endpoints сразу, а подготавливается поэтапно.
Runtime access model, tenant middleware и существующие бизнес-модули не менялись на этом подшаге.



Название блока:
Audit Log Foundation v1 — Initial Runtime Integration

Что сделано:
Audit logging подключён к первым runtime-операциям текущего operational contour: созданию заказа и созданию курьера. После успешного выполнения createOrder и createCourier система создаёт audit-записи с tenant context, actor context, entity type/id, action name и компактной metadata.

Принятые решения:

Audit вызывается только после успешного завершения основной create-операции.
Для actor context используется request-based helper с поддержкой x-actor-id и x-actor-label.
Для order.created сохраняется metadata с externalId и status.
Для courier.created сохраняется metadata с status и transportType.
Основной бизнес-flow не менялся и не оборачивался в сложную audit orchestration logic.

Ограничения / next note:
На текущем этапе audit подключён только к части critical operations. Следующий шаг — поэтапное расширение audit coverage на assignment flow (order.assigned, order.unassigned) без усложнения бизнес-логики и без внедрения полного diff-а изменений.



Название блока:
Audit Log Foundation v1 — Update Flow Coverage

Что сделано:
Audit logging расширен на операции обновления заказов и курьеров. После успешных updateOrder и updateCourier система создаёт audit-события order.updated и courier.updated с tenant context, actor context, entity type/id и компактной metadata на основе списка изменённых полей.

Принятые решения:

Для update-операций используется компактная metadata в формате { changedFields: Object.keys(req.body) }.
Сервисный слой не изменялся; audit интегрирован на уровне контроллеров после успешного завершения основной операции.
Audit не вызывается при ошибках update, включая 404 и ошибки БД.
Подход intentionally не использует diff engine, before/after snapshots и сложную оркестрацию изменений.

Ограничения / next note:
На текущем этапе audit уже покрывает create/update/assignment flow для orders и create/update для couriers. Для завершения Audit Log Foundation v1 остаётся подключить batch-level audit к importOrders через одну компактную запись на операцию импорта.



Audit Log Foundation v1 — Completed

Что сделано:
Audit logging полностью внедрён в текущий critical operational contour проекта. Система создаёт audit-события для создания, обновления, назначения, снятия назначения и импорта заказов, а также для создания и обновления курьеров. Каждая запись содержит tenant context, actor context, entity type/id, action и компактную metadata.

Принятые решения:

Audit интегрирован поэтапно и только после успешного завершения основной бизнес-операции.
Для batch-импорта используется одна aggregate audit-запись order.imported, а не запись на каждый импортируемый заказ.
В metadata сохраняются только компактные и полезные данные, без full payload и без diff engine.
Service layer не подвергался лишнему рефакторингу; audit подключён на уровне контроллеров.
Actor context временно берётся из request headers, без полноценной auth/session model.

Ограничения / next note:
Текущая реализация является Audit Log Foundation v1 и не включает transactional outbox, retry/fallback, read API для audit, UI просмотра истории или полный before/after diff. Следующий фундаментальный шаг — Status Model Foundation v1: зафиксировать единый canonical source of truth для статусных полей компании, заказов, курьеров и access-моделей.



Status Model Foundation v1 — Canonical Constants

Что сделано:
Для статусных полей проекта создан единый canonical source of truth в виде foundation constants files. Зафиксированы допустимые наборы значений для Order, Courier, а также для будущих access-моделей User и CompanyMembership, без изменения текущего runtime и без введения жёстких enum-типов на уровне БД.

Принятые решения:

Company оставлен в текущем состоянии как уже более зрелая часть status model.
Для Order зафиксирован canonical status set: pending, assigned, in_transit, delivered, failed, cancelled, returned.
Для Courier зафиксированы canonical наборы для status, transportType и trackingStatus.
Для User и CompanyMembership зафиксированы базовые access-статусы на будущее.
На данном этапе runtime и validation намеренно не менялись, чтобы не вносить breaking changes без отдельной проверки active contour.

Ограничения / next note:
На текущем этапе canonical constants существуют как foundation source of truth, но ещё не применяются в validation для orders и couriers. Следующий шаг — точечно ужесточить validation active operational contour через canonical constants, не вводя transition rules и не меняя service layer.




tatus Model Foundation v1 — Write Validation Hardening

Что сделано:
Canonical status constants подключены к write-level validation для active operational contour. Для orders и couriers входные payload на create/update теперь принимают только допустимые canonical значения для статусных полей и связанных operational vocabularies.

Принятые решения:

Для Order.status включена validation against canonical status set на create и update.
Для Courier.status, Courier.transportType и Courier.trackingStatus включена validation against canonical values на create и update.
Изменения применены только на уровне validation guards, без изменения service layer, Prisma schema и response contracts.
Query filters намеренно не были затронуты на этом шаге, чтобы разделить write hardening и filter hardening на разные controlled этапы.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые отправляют неканоничные значения в write payload. Существующие данные в БД не мигрировались и read path не менялся. Следующий шаг — точечное query filter hardening для Order.status и Courier.status/transportType в list/map endpoints.





Что сделано:
Canonical status constants подключены к query-level validation для active operational contour. Фильтры списка и map endpoints по статусам и transport type теперь принимают только допустимые canonical значения, что устраняет semantic drift между write path, query path и internal status vocabulary.

Принятые решения:

Для orders ужесточена validation query-параметра status в list/map endpoints.
Для couriers ужесточена validation query-параметров status и transportType.
Optional query params сохранили свою optional semantics: validation применяется только если параметр передан.
Service layer, routes, controllers и response contracts не изменялись; hardening выполнен только на уровне validation guards.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые используют неканоничные query filter values. Runtime filtering logic не менялась, но теперь входные значения фильтров проходят через canonical validation. Следующий фундаментальный шаг — Company Status Effects Foundation v1: определить и внедрить базовое поведение tenant-scoped write operations в зависимости от статуса компании.




Company Status Effects Foundation v1

Что сделано:
В tenant-scoped operational runtime добавлена базовая зависимость write-действий от статуса компании. Для текущего active contour любые write operations по заказам и курьерам разрешены только для компаний со статусом active. Для компаний в остальных статусах (inactive, suspended, trial, pending_setup, archived) write-действия блокируются до выполнения бизнес-операции.

Принятые решения:

Проверка вынесена в единый reusable guard.
Guard вызывается сразу после получения tenant context и до обращения к business logic.
Для non-active компаний возвращается controlled error 403 Forbidden с сообщением Company is not operational.
Read endpoints намеренно не блокируются на данном этапе, чтобы сохранить readonly visibility и диагностическую доступность данных.

Ограничения / next note:
Текущая реализация вводит базовое operational правило “write only for active company”, но пока не различает более тонкие сценарии для статусов вроде trial или pending_setup. Следующий фундаментальный шаг — Source-of-Truth Protection Foundation v1: ограничить ручные update-операции по заказам только logistics-owned полями и убрать возможность менять external/business-owned данные через общий update endpoint.


Source-of-Truth Protection Foundation v1 — updateOrder Hardening

Что сделано:
Контракт ручного обновления заказа через updateOrder сужен до logistics-owned полей. Теперь через общий update endpoint допускается изменять только status и comment, а изменение external/business-owned полей отклоняется на уровне validation.

Принятые решения:

validateUpdateOrderInput и UpdateOrderInput ограничены только полями status и comment.
Поля externalId, address, lat, lng, deliveryDate, companyId, courierId и любые другие нестандартные поля больше не допускаются в PATCH /orders/:id.
Assignment flow намеренно оставлен отдельным через специализированные endpoints assignOrder / unassignOrder.
Service layer не менялся; защита реализована через input contract и validation hardening.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые использовали updateOrder для изменения business-owned или integration-owned полей. Следующий шаг — аналогично сузить createOrder до manual logistics contract, чтобы ручное создание заказа не размывало границу между Logistics Center и внешними source-of-truth системами.





Source-of-Truth Protection Foundation v1 — manual createOrder Hardening

Что сделано:
Контракт ручного создания заказа через POST /orders отделён от внешнего import-контракта. Для manual create теперь разрешён только узкий logistics-owned набор полей, а попытки передать integration-owned или system-owned поля отклоняются на уровне validation.

Принятые решения:

Для POST /orders введён отдельный validator validateManualCreateOrderInput.
Manual createOrder принимает только status, address, deliveryDate и comment.
Поля externalId, lat, lng, companyId, courierId и любые другие нестандартные поля больше не допускаются в ручном create flow.
validateCreateOrderInput сохранён отдельно для import path и продолжает использоваться через POST /orders/import.
Audit order.created сохранён и корректно работает как для manual orders, так и для imported orders.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые использовали POST /orders как универсальный create endpoint с external/business-owned полями. Следующий шаг — аналогично сузить updateCourier, чтобы отделить manual profile updates от tracking-owned courier data.





Source-of-Truth Protection Foundation v1 — updateCourier Hardening

Что сделано:
Контракт ручного обновления курьера через PATCH /couriers/:id сужен до manual operational profile fields. Теперь через общий update endpoint допускается изменять только профильные данные курьера, а tracking-owned и system-owned поля отклоняются на уровне validation.

Принятые решения:

validateUpdateCourierInput и соответствующий input contract ограничены полями firstName, lastName, phone, status, transportType.
Поля lat, lng, lastLocationAt, locationSource, trackingStatus, companyId и любые другие нестандартные поля больше не допускаются в PATCH /couriers/:id.
Tracking/GPS данные считаются отдельным source-of-truth и не должны обновляться через общий courier update flow.
Readonly endpoints и audit flow не изменялись и не были затронуты этим шагом.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые использовали updateCourier для передачи tracking/GPS данных. Следующий шаг — аналогично сузить createCourier, чтобы manual courier creation не размывал границу между profile data и будущим tracking ingestion flow.




Source-of-Truth Protection Foundation v1 — createCourier Hardening

Что сделано:
Контракт ручного создания курьера через POST /couriers сужен до manual profile fields. Теперь endpoint создания курьера используется только для заведения профиля курьера, а tracking-owned и system-owned поля отклоняются на уровне validation.

Принятые решения:

validateCreateCourierInput и соответствующий input contract ограничены полями firstName, lastName, phone, status, transportType.
Поля lat, lng, lastLocationAt, locationSource, trackingStatus, companyId и любые другие нестандартные поля больше не допускаются в POST /couriers.
Tracking/GPS данные считаются отдельным source-of-truth и выведены из общего courier create/update flow.
Read contour и audit flow не изменялись и не были затронуты этим шагом.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для клиентов, которые использовали createCourier для одновременной передачи profile и tracking-state данных. Следующий фундаментальный шаг — Courier Tracking Ingestion Foundation v1: определить и внедрить отдельный tenant-safe endpoint для обновления tracking-owned полей курьера.




Courier Tracking Ingestion Foundation v1 — Contract Definition

Что сделано:
Для tracking-owned данных курьера зафиксирован отдельный tenant-scoped endpoint contract PATCH /couriers/:id/tracking. Контракт отделён от общего courier create/update flow и предназначен только для обновления telemetry-полей курьера.

Принятые решения:

Tracking endpoint обновляет только lat, lng, lastLocationAt, locationSource, trackingStatus.
Profile-owned поля (firstName, lastName, phone, status, transportType) не входят в tracking contract.
Все поля request body optional, но хотя бы одно поле должно быть передано.
lat и lng должны передаваться только парой.
Для locationSource зафиксирован ограниченный canonical vocabulary: gps, manual, network.
Для trackingStatus используется existing canonical set online, offline, idle.

Ограничения / next note:
На текущем этапе определён только contract foundation. Следующий шаг — подключить runtime реализацию route/controller/service для PATCH /couriers/:id/tracking с tenant-safe lookup и обновлением только tracking-owned полей. В v1 намеренно не включаются audit, history table, timestamp ordering, batch updates и device-level auth separation.






Courier Tracking Ingestion Foundation v1 — Runtime Endpoint

Что сделано:
В проекте реализован отдельный tenant-scoped endpoint PATCH /couriers/:id/tracking для обновления tracking-owned полей курьера. Endpoint использует отдельный validation contract, работает только внутри текущего tenant context и обновляет только telemetry-поля курьера.

Принятые решения:

Tracking endpoint обновляет только lat, lng, lastLocationAt, locationSource, trackingStatus.
Profile-owned поля (firstName, lastName, phone, status, transportType) не допускаются в tracking update flow.
Перед выполнением update применяется requireTenantContext(req) и assertCompanyOperational(companyId).
Tenant safety обеспечивается lookup-ом courier по id + companyId перед update.
Endpoint возвращает обновлённый courier в том же формате, что и существующие courier read flows.

Ограничения / next note:
Текущая реализация является Tracking Ingestion Foundation v1 и пока не включает audit logging, timestamp ordering protection, telemetry history table, batch tracking updates, realtime broadcasting или device-level auth separation. Следующий шаг — подключить audit для courier.tracking_updated без усложнения telemetry architecture.







Courier Tracking Ingestion Foundation v1 — Audit Coverage

Что сделано:
Для endpoint PATCH /couriers/:id/tracking добавлен audit logging. После успешного обновления tracking-owned полей система создаёт audit-событие courier.tracking_updated с tenant context, actor context, entity type/id и компактной metadata.

Принятые решения:

Audit подключён только после успешного выполнения updateTracking.
Для tracking updates используется action courier.tracking_updated.
В metadata сохраняется компактный payload вида { changedFields: Object.keys(req.body) }.
При ошибке validation, tenant/company guard или service update audit не создаётся.

Ограничения / next note:
Текущая реализация по-прежнему не защищает от out-of-order tracking packets: более старый timestamp может перезаписать более свежий. Следующий шаг — timestamp ordering protection v1 для updateTracking с controlled reject stale updates через 409 Conflict.




Courier Tracking Ingestion Foundation v1 — Stale Update Protection

Что сделано:
Для tracking endpoint PATCH /couriers/:id/tracking добавлена защита от out-of-order updates. Если входящий lastLocationAt старше текущего lastLocationAt курьера, update отклоняется controlled error и не перезаписывает более свежие tracking данные.

Принятые решения:

Сравнение timestamp выполняется в service layer после tenant-safe lookup курьера.
Сравнение основано на реальном времени (Date), а не на строковом сравнении.
Update отклоняется только при строгом условии incoming < current.
Равный timestamp допускается как idempotent retry.
При stale update возвращается 409 Conflict с сообщением Tracking update is older than current courier location.
Audit не создаётся, если tracking update отклонён по stale timestamp.

Ограничения / next note:
Текущая реализация защищает только от перезаписи свежих tracking данных более старыми пакетами, но пока не даёт read-side интерпретации “насколько свежа” текущая геопозиция. Следующий шаг — Tracking Freshness Readiness v1: подготовить reusable helper для вычисления свежести tracking данных без изменения БД и без фоновых пересчётов




Tracking Freshness Readiness v1

Что сделано:
В проект добавлен reusable helper для вычисления свежести tracking данных курьера. Функция isCourierTrackingFresh(...) определяет, считаются ли координаты курьера свежими, на основе lastLocationAt и фиксированного freshness threshold без изменения данных в БД и без фоновых пересчётов.

Принятые решения:

Freshness threshold зафиксирован как 15 minutes.
Helper возвращает false, если lastLocationAt отсутствует.
Helper принимает Date | string | null, чтобы одинаково удобно использоваться как на Prisma-слое, так и на API/read-side слое.
Параметр now сделан явным с дефолтным значением, чтобы функция была тестируемой и не зависела от мокания глобального времени.
На текущем этапе helper не подключён автоматически ни к одному endpoint и не изменяет runtime behavior сам по себе.

Ограничения / next note:
Текущий шаг подготавливает read-side foundation для интерпретации tracking freshness, но ещё не использует её в API responses. Следующий шаг — точечно подключить computed поле isTrackingFresh в GET /couriers/map, не меняя БД, не скрывая stale couriers и не переписывая trackingStatus в базе.



Tracking Freshness Readiness v1 — Map Read Integration

Что сделано:
В GET /couriers/map добавлено вычисляемое read-side поле isTrackingFresh, основанное на helper isCourierTrackingFresh(...). Freshness вычисляется на лету по lastLocationAt и не требует изменения данных в БД.

Принятые решения:

isTrackingFresh добавляется только в map response и не изменяет существующие поля courier map DTO.
Для вычисления freshness service layer временно использует lastLocationAt во внутреннем select, но это поле не возвращается наружу в API response.
Persisted trackingStatus и computed isTrackingFresh остаются разными понятиями.
Другие courier endpoints (GET /couriers, GET /couriers/:id, tracking write endpoints) этим шагом не затрагивались.

Ограничения / next note:
На текущем этапе freshness используется только как read-side enrichment для courier map. Следующий шаг — Order Import Contract Hardening v1: сделать externalId обязательным для каждого imported order item, чтобы import path был жёстко привязан к external source of truth.






Order Import Contract Hardening v1

Что сделано:
Для external import path ужесточён input contract: каждый order item в POST /orders/import теперь обязан содержать непустой externalId. Это закрепляет import endpoint как канал внешнего source of truth, а не как запасной bulk-create без внешней идентичности.

Принятые решения:

Проверка externalId добавлена только в validateImportOrdersInput.
Manual POST /orders не менялся и по-прежнему допускает создание заказа без externalId.
Для import items externalId теперь считается обязательным external identity marker.
Existing import service flow не менялся; изменение реализовано только на уровне validation.

Ограничения / next note:
Этот шаг вводит осознанный breaking change для интеграций, которые импортировали заказы без внешних идентификаторов. Следующий фундаментальный шаг — Import Idempotency Readiness v1: добавить tenant-scoped uniqueness boundary на (companyId, externalId), чтобы один и тот же внешний заказ не мог быть создан дважды в рамках одной компании.




Import Idempotency Readiness v1

Что сделано:
Для заказов добавлена tenant-scoped uniqueness boundary по паре (companyId, externalId). Это гарантирует, что один и тот же внешний заказ не может быть создан дважды в рамках одной компании и подготавливает import path к idempotent-friendly поведению.

Принятые решения:

В Order добавлен unique constraint @@unique([companyId, externalId]).
В import flow включён skipDuplicates: true для createMany, чтобы повторный import одного и того же внешнего заказа не приводил к ошибке и не создавал дубль.
Manual orders без externalId продолжают поддерживаться, так как externalId остаётся nullable и PostgreSQL допускает multiple NULL внутри unique constraint.
Перед применением migration была выполнена проверка на existing duplicates; дубли в текущих данных не обнаружены.

Ограничения / next note:
Текущая реализация обеспечивает idempotent skip для duplicate external orders, но не выполняет update/upsert существующих заказов. Повторный import не обновляет уже существующую запись, а только пропускает её. Следующий шаг — Import Duplicate Visibility v1: сделать requested/created/skipped counts явными в response, чтобы skipped duplicates были прозрачны для API-клиента и операционной команды.





Import Duplicate Visibility v1

Что сделано:
Результат POST /orders/import сделан прозрачнее для API-клиентов и операционной команды. Import response теперь явно показывает количество полученных элементов, количество реально созданных заказов и количество пропущенных записей, что делает duplicate-skipping поведение наблюдаемым и семантически понятным.

Принятые решения:

В import result добавлены/зафиксированы поля requestedCount, createdCount, skippedCount.
skippedCount рассчитывается как requestedCount - createdCount.
Повторные заказы с тем же (companyId, externalId) не создаются повторно и отражаются в skippedCount.
Старое поле failedCount удалено как семантически неверное для duplicate-skipping сценария.
Audit metadata для order.imported приведена в соответствие с новым import result shape.

Ограничения / next note:
Текущая реализация делает duplicate-skipping прозрачным, но семантика partial non-fatal problems ещё требует уточнения: сейчас geocoding problems отражаются через errors, хотя order при этом создаётся. Следующий шаг — Import Error Semantics Hardening v1: разделить skipped duplicates и non-fatal warnings в import response.






Import Error Semantics Hardening v1

Что сделано:
В import response уточнена семантика partial non-fatal issues. Поле errors переименовано в warnings, чтобы отделить нефатальные проблемы импорта от реально не созданных записей. Теперь warnings отражает случаи, когда заказ создан, но с неполными/деградированными данными, например без координат после неуспешного geocoding.

Принятые решения:

Поле warnings заменяет прежнее errors в результате POST /orders/import.
Структура warning items сохранена в формате { index, message }.
skippedCount остаётся отдельной метрикой и отражает только не созданные записи, например duplicate imports.
Import business logic не менялась: createMany, skipDuplicates, geocoding flow и расчёт counts остались прежними.

Ограничения / next note:
Текущая реализация вводит осознанный breaking change для клиентов, читающих data.errors. Следующий шаг — Import Response Backward Compatibility v1: временно вернуть errors как deprecated alias поля warnings, чтобы обеспечить безопасный переход старых клиентов на новую семантику response.




Import Response Backward Compatibility v1

Что сделано:
Для POST /orders/import добавлен временный compatibility layer: response теперь возвращает и canonical поле warnings, и deprecated alias errors. Это позволяет новым клиентам перейти на корректную семантику non-fatal import issues без поломки старых интеграций, которые ещё читают data.errors.

Принятые решения:

warnings остаётся canonical полем для non-fatal import issues.
errors временно возвращается как compatibility alias того же массива.
Alias реализован на уровне контроллера без дублирования business logic в service layer.
Семантика skippedCount не менялась: duplicates по-прежнему отражаются отдельно от warnings/errors.

Ограничения / next note:
Текущий compatibility alias errors является временным полем и не должен становиться постоянной частью контракта. Следующий шаг — явно пометить errors как deprecated в import response, чтобы подготовить безопасное удаление compatibility field в будущем.





Import Response Backward Compatibility v1 — Deprecation Signal

Что сделано:
В результат POST /orders/import добавлен явный машиночитаемый deprecation signal для compatibility field errors. Response теперь возвращает canonical поле warnings, временный alias errors и флаг errorsDeprecated: true, который позволяет клиентам безопасно мигрировать на новый контракт.

Принятые решения:

warnings остаётся единственным canonical полем для non-fatal import issues.
errors сохраняется только как временный compatibility alias того же массива.
errorsDeprecated: true добавлен как простой машиночитаемый сигнал, не требующий отдельной документации или versioned API.
Business logic import flow и response counts не менялись.

Ограничения / next note:
Compatibility alias errors остаётся временной частью контракта и должен быть удалён на отдельном шаге после миграции клиентов на warnings. Следующий маленький шаг — обогатить audit metadata для order.imported полями warningCount и hasWarnings, чтобы degraded imports были видны в истории операций без сохранения полного warnings payload.







Import Warnings Audit Enrichment v1

Что сделано:
Audit metadata для order.imported обогащена признаками non-fatal degraded import. Теперь audit-запись импорта содержит не только counts по batch, но и компактную информацию о наличии предупреждений в ходе импорта.

Принятые решения:

В audit metadata добавлены поля warningCount и hasWarnings.
Полный массив warnings не сохраняется в audit, чтобы не раздувать metadata и не дублировать response payload.
Existing counts (requestedCount, createdCount/importedCount, skippedCount) сохранены.
Response POST /orders/import не менялся; enrichment выполнен только на уровне audit logging.

Ограничения / next note:
На текущем этапе в audit metadata ещё сохраняется naming drift между response и audit (createdCount в response против importedCount в audit). Следующий маленький шаг — привести audit metadata к тому же vocabulary, что и import response, заменив importedCount на createdCount.





Import Audit Naming Consistency v1

Что сделано:
Audit metadata для order.imported приведена к тому же vocabulary, что и import response. В audit больше не используется отдельное имя importedCount; вместо него применяется createdCount, что устраняет semantic drift между API response и audit trail.

Принятые решения:

В audit metadata сохранены поля requestedCount, createdCount, skippedCount, warningCount, hasWarnings.
Поле importedCount удалено как дублирующее по смыслу и создающее лишнюю путаницу.
Response POST /orders/import не менялся; выравнивание выполнено только на уровне audit logging.
Import business logic и counts calculation не изменялись.

Ограничения / next note:
На текущем этапе manual и imported orders уже разведены по контрактам, но их происхождение ещё не зафиксировано явным полем в самой модели Order. Следующий фундаментальный шаг — Order Source Attribution Foundation v1: добавить server-owned поле sourceType со значениями manual и imported для явного закрепления происхождения заказа.






Order Source Attribution Foundation v1

Что сделано:
В модель Order добавлено server-owned поле sourceType, которое явно фиксирует происхождение заказа (manual или imported). Это устраняет зависимость от косвенной логики через externalId и делает источник данных явным на уровне доменной модели.

Принятые решения:

sourceType добавлен как String с default значением "manual".
Для POST /orders значение жёстко устанавливается как "manual".
Для POST /orders/import значение жёстко устанавливается как "imported".
Поле не принимается из request body и не может быть подменено клиентом.
Для существующих данных выполнен backfill:
externalId IS NOT NULL → sourceType = imported
externalId IS NULL → sourceType = manual
Existing runtime (map, assign, update, audit) не был нарушен.

Ограничения / next note:
На текущем этапе sourceType используется только как атрибут данных и не влияет на поведение системы. Следующий шаг — Order Ownership Protection v1: добавить audit-level различие при изменении imported orders для повышения прозрачности и подготовки к возможным ограничениям в будущем.







Order Ownership Protection v1 — Soft Guard

Что сделано:
Для ручного обновления заказов добавлено audit-level различие между manual и imported orders. При update manual order система продолжает писать событие order.updated, а при update imported order создаёт отдельное audit-событие order.updated_imported.

Принятые решения:

Изменение imported orders на текущем этапе не запрещается.
Различие реализовано только на уровне audit action без изменения update flow и без двойного логирования.
Metadata audit-события сохранена в прежнем формате { changedFields }.
Выбор action выполняется по data.sourceType, возвращённому из service layer после успешного update.

Ограничения / next note:
На текущем этапе защита imported orders остаётся soft-level и даёт только traceability в audit. Следующий шаг — Imported Order Edit Warning v1: добавить явный warning signal в response PATCH /orders/:id, если вручную обновляется imported order.







Imported Order Edit Warning v1

Что сделано:
Для PATCH /orders/:id добавлен явный response-level warning signal при ручном обновлении imported orders. Если обновляется заказ с sourceType = imported, API возвращает успешный ответ с дополнительным полем warning, указывающим, что imported order был изменён вручную.

Принятые решения:

Imported orders по-прежнему не блокируются на update; защита остаётся soft-level.
Для manual orders response shape не меняется и warning не добавляется.
Для imported orders response дополняется полем warning: "Imported order was updated manually".
Audit logic и HTTP status code не менялись; visibility signal добавлен только на уровне response.

Ограничения / next note:
На текущем этапе response warning добавлен только для updateOrder. Следующий шаг — распространить тот же visibility pattern на ручные assignment operations imported orders: assignOrder и unassignOrder.





Imported Order Assignment Visibility v1

Что сделано:
Для imported orders visibility pattern распространён на assignment flow. При ручном назначении или снятии назначения у orders с sourceType = imported система создаёт отдельные audit-события и возвращает response-level warning, сигнализирующий о ручном вмешательстве в imported order.

Принятые решения:

Для imported orders используются отдельные audit actions:
order.assigned_imported
order.unassigned_imported
Для manual orders сохраняются прежние action names:
order.assigned
order.unassigned
Response для imported orders дополняется warning:
Imported order was assigned manually
Imported order was unassigned manually
Metadata assignment events не менялась и остаётся в прежнем формате:
assign → { courierId }
unassign → { previousCourierId }

Ограничения / next note:
На текущем этапе ручное вмешательство в imported orders видно в audit и response, но не оставляет отдельного persistent marker на самой сущности Order. Следующий шаг — Imported Order Manual Mutation Flag v1: добавить server-owned поле isManuallyTouched, которое будет устанавливаться в true при ручном update/assign/unassign imported orders.






Multi-Tenancy Architecture Decision

Logistics Center is designed as a multi-tenant SaaS platform where Company is the tenant unit.

For MVP and early scalable product stages, the platform uses a single database with separate schemas per tenant, plus a dedicated system schema for platform-level data.

Architecture model
One shared physical database
One system schema for platform-level and cross-tenant data
One dedicated tenant schema per company for company operational data

This model is selected because it provides:

stronger tenant isolation than shared-schema multi-tenancy
lower operational complexity than database-per-tenant
support for centralized Super Admin oversight
a scalable foundation for onboarding many companies
System schema

The system schema stores platform-level data that is not owned by a specific tenant operational domain, including:

Companies
Tenant registry and schema metadata
Super Admin accounts
Platform-level configuration
Global reference dictionaries intended to be shared across all tenants
Super Admin audit events
Impersonation / tenant access logs
Tenant provisioning metadata
Tenant schema

Each company has its own tenant schema. Tenant schema stores company-owned operational and configuration data, including:

Company users
Couriers
Warehouses
Origin points
Orders
Order stops
Routes
Zones
Shifts
Payouts
Company integrations
SLA rules
Company operational settings
Company-level audit logs
Tenant isolation rules
Company operational data must never be stored in shared tenant tables across companies
Each company works only with its own tenant schema
Company users must never access another company’s schema
Cross-tenant access is forbidden for all company-level actors
Super Admin model

Super Admin is a system-level actor, not a tenant actor.

Super Admin may:

view all companies from the system layer
open a specific company context
perform administrative actions inside a tenant context only through explicit support / impersonation flow

All tenant-context access by Super Admin must be:

explicit
auditable
attributable to a named actor
timestamped
recorded with access reason where applicable
Strategic note

Database-per-tenant is not the default architecture for MVP.
It may be considered later for specific enterprise clients if contractual, compliance, or operational requirements demand dedicated infrastructure.

8. What we do not touch yet

Пока сознательно не трогаем:

порядок миграций по tenant schemas;
provisioning automation;
tenant-aware repository implementation;
order statuses;
route lifecycle;
permissions matrix;
integrations contract;
payout model.




Ниже готовый текст для foundation. Я дам основной вариант с рекомендованным partial status.

Core Dispatching Data Model

The dispatching domain is modeled around Orders, Order Stops, Routes, and Route Stops.

Planning unit

The primary route planning unit is Stop, not Order.

Dispatchers work operationally with the sequence of route points that must be visited by a courier.
Therefore, route construction and route editing are based on stops.

Order and Order Stop

An Order is the business delivery object received from an external system or created internally if such capability is introduced later.

An Order may contain one or multiple Order Stops.

Order Stops represent the actual logistical points related to order fulfillment, such as:

pickup point
delivery point
additional delivery point
return-related point if required in future stages

Single-stop orders remain a first-class MVP case.
Multi-stop orders are supported at the foundation level.

Route and Route Stop

A Route is a courier execution plan.

A Route does not use Order as its primary internal planning unit.
A Route contains Route Stops.

A Route Stop is a scheduled stop inside a route and references a specific Order Stop.

Route Stop exists as a separate entity because the system must support:

explicit stop sequence in a route
manual stop reordering by dispatcher
route editing without changing the original order structure
future operational extensions
Cardinality
One Order → many Order Stops
One Route → many Route Stops
One Route Stop → one Order Stop
In MVP, one Order Stop may belong to zero or one active Route at a time, unless a future redesign explicitly allows more complex reassignment logic
Dispatcher workflow in MVP

In MVP, incoming delivery work primarily arrives as Orders from external systems.

The dispatcher does not create delivery demand manually as a primary workflow.
The dispatcher receives delivery orders and organizes their execution by building a route as a sequence of stops.

For usability, the interface may still present work in an order-first view.
However, when an order is added to a route, the system must place its active order stops into the route structure.

Inside route editing, the dispatcher operates on stop sequence.

Partial execution

The model must support partial execution of a multi-stop order in MVP.

This means:

some order stops may be completed
some order stops may fail, be skipped, or remain unresolved
the final order result must be derived from stop-level execution outcome

Recommended foundation rule:

if at least one required stop is completed and at least one required stop is not successfully completed, the order may transition into a dedicated partial completion result state
Courier in MVP

In MVP, Courier is treated as a company operational entity, not as a mandatory live authenticated product user.

Courier records are used for:

route assignment
execution ownership
shift linkage
payout calculation
analytics

Courier-facing application access is planned for a future stage after the logistics web platform is established.

The foundation must allow future linking of Courier to a dedicated user account without redesigning the dispatching domain





Order Lifecycle — System Status Model

Order lifecycle in Logistics Center is controlled by an internal system-level status model.

This model is the operational source of truth for:

dispatching
execution control
route assignment
audit trail
analytics
future payout logic
conflict resolution with external systems
External source statuses vs internal system statuses

External systems such as CRM may provide their own business statuses for orders.

Examples may include:

packed
ready for delivery
ready for dispatch
any other company-specific source status

These source statuses may vary between companies and must be stored as external source data.

However, Logistics Center must not rely on external CRM statuses as its execution state machine.

Logistics Center uses a separate internal system status model for all logistics execution logic.

This separation is mandatory so that:

different clients may keep their own CRM vocabulary
the platform still has a unified execution model
integrations remain configurable without breaking core logistics behavior
Source status configurability

For each company, the platform may support configuration of:

which external source statuses are imported
which source statuses are visible to logistics users
which source statuses are shown on the map
which source statuses are considered eligible for planning

This configurability applies only to the external source layer.
It does not replace or redefine the internal Logistics Center system status model.

Internal system statuses for MVP

Recommended internal system statuses for Order in MVP:

planning
assigned
in_execution
completed
delivery_failed
Status meaning
planning — order is available for logistics planning and may be placed into a route
assigned — order has been placed into a route or reserved for execution, but actual execution has not started yet
in_execution — courier has actually started route execution and the order is now in protected logistics execution flow
completed — order has been successfully completed
delivery_failed — order execution was attempted or operationally progressed but did not result in successful delivery completion
Execution boundary

Order becomes in_execution only when the courier actually starts route execution.

Order is not considered in execution merely because:

it was imported
it became visible for planning
it was assigned into a route

This boundary is critical because after execution starts:

logistics-controlled data gains priority
execution context must be protected
external source updates must no longer blindly overwrite operationally critical fields
Allowed high-level transitions
planning -> assigned
assigned -> planning
assigned -> in_execution
in_execution -> completed
in_execution -> delivery_failed
Transition principles
Orders enter Logistics Center operational flow in planning state once they are eligible for logistics work
Dispatcher may assign order to route: planning -> assigned
Dispatcher may remove order from route before execution starts: assigned -> planning
When courier actually starts route execution, order transitions: assigned -> in_execution
Successful execution completes order: in_execution -> completed
Unsuccessful execution closes order as failed delivery: in_execution -> delivery_failed
Update ownership boundary

Before in_execution:

external CRM updates may be accepted according to integration ownership rules

After in_execution:

logistics execution context becomes protected
logistics-side data must not be blindly overwritten by external source updates
conflict resolution must prioritize Logistics Center operational state for protected fields
Partial execution

For multi-stop orders, stop-level execution may be mixed.

In MVP, partial execution does not introduce a dedicated terminal order status.

Final order status must still resolve into the limited internal status model.
If the overall order does not complete successfully, it resolves to delivery_failed.

However, the system must preserve the fact of partial execution as a separate execution outcome or derived indicator for:

operations
analytics
support investigation
future payout or exception handling logic
Actor responsibility at high level
Integration layer may create or update orders before execution boundary according to ownership rules
Dispatcher / logistician may assign and unassign orders before execution starts
System may transition order into execution and final result states based on route execution events
Courier-facing actions may be added in future stages when courier application becomes part of the product
8. What we do not touch yet

Пока сознательно не трогаем:

business-facing custom status names in UI;
route state machine;
detailed stop state model;
detailed failure reason taxonomy;
outward status sync mapping to CRM;
SLA formula triggers;
payout triggers by final status.









Ниже — финальный блок для foundation.

Permissions Model (RBAC)

Logistics Center uses a role-based access control model at the company (tenant) level.

Tenant roles (MVP)

Each company uses the following fixed roles in MVP:

Owner — full access to company operational data, users, integrations, and settings
Dispatcher — operational role responsible for dispatching, routing, and execution management
Viewer — read-only role for monitoring and oversight

In MVP, roles are fixed and are not configurable by companies.

System role

Super Admin is a system-level role and is not part of tenant RBAC.

Super Admin:

works through the platform system layer
may enter tenant context only through explicit context switch or impersonation flow
must always be fully audited when accessing tenant data or acting inside tenant context
RBAC resources in MVP

Permissions are defined for the following core resource groups:

Orders
Routes
Couriers
Users
Integrations
Settings
Permission action types

The permission model uses the following action types:

read
create
update
delete
assign
execute

Where needed:

assign covers operational assignment actions such as linking orders, routes, and couriers
execute covers execution-related actions such as starting or completing operational flow
Permission matrix (MVP)
Orders
Role	Read	Update	Assign	Delete
Owner	Yes	Yes	Yes	Yes
Dispatcher	Yes	Yes	Yes	No
Viewer	Yes	No	No	No
Routes
Role	Read	Create	Update	Execute	Delete
Owner	Yes	Yes	Yes	Yes	Yes
Dispatcher	Yes	Yes	Yes	Yes	No
Viewer	Yes	No	No	No	No
Couriers
Role	Read	Create	Update	Delete
Owner	Yes	Yes	Yes	Yes
Dispatcher	Yes	No	No	No
Viewer	Yes	No	No	No
Users
Role	Read	Create	Update	Delete
Owner	Yes	Yes	Yes	Yes
Dispatcher	No	No	No	No
Viewer	No	No	No	No
Integrations
Role	Read	Create	Update	Delete
Owner	Yes	Yes	Yes	Yes
Dispatcher	No	No	No	No
Viewer	No	No	No	No
Settings
Role	Read	Update
Owner	Yes	Yes
Dispatcher	Yes	No
Viewer	No	No
Enforcement rules

Permissions must be enforced on backend API level.

Frontend visibility rules are supportive UX behavior only and must not be treated as security enforcement.

Each protected request must be validated against:

authenticated actor
actor role
tenant context
requested action
target resource
Future extension note

Future product stages may introduce:

more granular permissions
custom role composition
field-level restrictions
additional read-only administrative access patterns

These capabilities are outside MVP scope.

8. What we do not touch yet

Пока сознательно не трогаем:

field-level RBAC
per-object ownership permissions
delegated admin models
audit log schema
integration authentication
support for custom roles






Ниже — финальный блок для foundation.

Integration Contract — Foundation Rules

Logistics Center uses a canonical integration contract for inbound and outbound order synchronization.

Integration architecture

External systems may connect to Logistics Center through integration adapters.

Supported integration transport patterns for MVP:

webhook push from external CRM or order source
API polling by Logistics Center adapter
future extension: manual or file-based import

Webhook push is the preferred integration pattern.
Polling is supported as a fallback for systems that cannot provide reliable push delivery.

Regardless of transport, all inbound order data must be transformed into a single canonical Logistics Center order contract.

Canonical contract principle

The platform must not depend on CRM-specific payload structures as a core execution model.

Each integration adapter is responsible for mapping source-specific payloads into the canonical Logistics Center contract.

This rule is mandatory so that:

the product remains stable across different CRM systems
backend logic is not rewritten per client
execution, analytics, and routing behavior stay unified
Configurable mapping layer

For each company, the integration layer may support configurable mapping and filtering rules, including:

which source statuses are imported
which source statuses are shown to logistics users
which source statuses are visible on the map
which source statuses make an order eligible for planning
which source fields are exposed to logistics operators in the interface

This configurability applies at the mapping and presentation layer only.
It does not redefine the internal canonical contract or the internal Logistics Center execution state machine.

Canonical inbound order identity

Within one company, order identity in integration scope is defined by:

integrationId
externalOrderId

This pair must be unique within the company.

Inbound synchronization uses upsert behavior:

create order if it does not exist
update existing order if it already exists
Minimum canonical inbound order contract (MVP)

The canonical inbound contract must support at minimum the following data groups.

Identification
integrationId
externalOrderId
externalStatus
externalUpdatedAt
Customer and destination
customerName (optional)
customerPhone (optional but supported)
deliveryAddressText (required)
deliveryLat (optional)
deliveryLng (optional)
Delivery planning context
deliveryDate (supported)
timeSlotFrom (optional)
timeSlotTo (optional)
comment or delivery instructions (optional)
Commercial and operational context
orderCost (supported)
source-side delivery cost or equivalent delivery amount if provided
additional mapped operational metadata required for logistics display
Stops

The canonical contract must support stop-based structure.

Even if many MVP orders are single-stop, inbound contract must allow stops[] so that the integration layer remains compatible with the stop-oriented dispatching model.

Traceability
sourcePayloadRaw must be stored for traceability, diagnostics, and support investigation
Authentication

Server-to-server integrations must use authenticated requests.

MVP authentication model:

integrationKey
integrationSecret
HMAC request signature validation

Recommended hardening:

request timestamp validation
replay protection window

Additional controls such as IP allowlisting may be introduced later, but are not the primary MVP authentication mechanism.

Idempotency

The platform must protect against duplicate inbound delivery.

Business-level idempotency

At minimum, duplicate order creation must be prevented by canonical order identity:

company
integrationId
externalOrderId
Request-level idempotency

Where supported by the source system, request-level idempotency may also use:

external event identifier
idempotency key
signed request timestamp window

If source system does not provide event-level identifiers, safe upsert by external order identity remains mandatory.

Ownership and update boundary

Before order enters in_execution, CRM-originated updates may be accepted according to mapping and ownership rules.

Typical source-owned fields before execution may include:

external status
delivery address
delivery date and time slot
customer contact details
delivery instructions and comments
other mapped source fields

After order enters in_execution, logistics-controlled execution data becomes protected.

Protected logistics context after execution start includes at minimum:

route assignment
courier assignment
stop sequence
execution timestamps
execution outcomes
logistics-side operational corrections and execution context

External systems must not blindly overwrite protected logistics data after execution has started.

Error model

Integration endpoints must return structured responses.

Recommended response behavior:

200 / 201 — request accepted and processed
400 — invalid request format or schema
401 — authentication or signature validation failure
403 — integration disabled, forbidden, or not allowed
409 — update conflict with protected execution state or ownership rules
422 — semantically invalid business payload
500 / 503 — temporary internal system failure
Retry policy

External systems may automatically retry temporary failures only.

Safe retry cases include:

timeout
network failure
500
503

Automatic retries must not be used for:

400
401
403
409
422
Outbound synchronization (MVP)

In MVP, Logistics Center must support limited outbound synchronization back to the source system.

Minimum outbound scope:

internal Logistics Center order execution status
assigned courier reference
delivery cost / payout-related delivery amount produced by Logistics Center

Recommended minimum outbound payload includes:

externalOrderId
lcOrderId
lcStatus
assigned courier reference
delivery cost calculated by Logistics Center
update timestamp

Outbound synchronization in MVP is intentionally limited and does not require a full event catalog.

8. What we do not touch yet

Пока сознательно не трогаем:

CRM-specific adapter details;
full field-by-field ownership matrix for every order field;
API versioning policy;
detailed webhook event catalog;
reconciliation dashboard;
manual import UX;
advanced retry backoff strategy;





Ниже — финальный текст для foundation.

Route Lifecycle — System Status Model

Route lifecycle in Logistics Center is controlled by a separate internal system status model.

Route is an operational execution container used to organize, assign, and track courier work.

Internal route statuses for MVP
draft
assigned
in_execution
completed
Status meaning
draft — route is being assembled and may be freely edited
assigned — route has a courier assigned and is prepared for execution, but actual execution has not started yet
in_execution — courier has actually started route execution
completed — all route stops have reached final outcome and route execution is closed
Allowed high-level transitions
draft -> assigned
assigned -> draft
assigned -> in_execution
in_execution -> completed
Execution boundary

A route becomes in_execution automatically when the courier actually starts the route.

The route is not considered in execution merely because:

it was created
it was edited
a courier was assigned
orders were added into it
Completion rule

A route becomes completed when all RouteStops have final execution outcome.

This does not require that all RouteStops are successful.
A completed route may still contain failed order or stop outcomes.

Route completion means that the execution container is closed, not that every delivery inside it was successful.

Editability rules
Draft

In draft, the route may be freely edited.

Allowed actions include:

add or remove orders and stops
reorder stops
assign or unassign courier
restructure route freely
Assigned

In assigned, the route is operationally prepared but not yet started.

Allowed actions still include:

add or remove orders and stops
reorder stops
change courier
return route back to draft if operationally required
In execution

In in_execution, route changes are still allowed, but only through controlled operational exception flow.

This means:

changes must be auditable
completed execution history must not be lost
already resolved route stops must not be overwritten as if execution never happened
route must not be treated as freely editable draft after execution start
Completed

In completed, route editing is not allowed.

Route failure and cancellation in MVP

MVP does not require separate terminal route statuses such as failed or cancelled.

Order- and stop-level execution outcomes are sufficient to represent unsuccessful delivery results.

Route itself is considered completed when its execution lifecycle is fully resolved.

Propagation rules to orders
When an order or its active order stops are included into a route prepared for execution, the related order enters assigned
When a route enters in_execution, related orders in assigned enter in_execution
Route stop outcomes participate in final order result aggregation
Final order result still resolves into the internal order lifecycle model, including completed or delivery_failed
8. What we do not touch yet

Пока сознательно не трогаем:

detailed RouteStop state machine;
courier app event catalog;
route analytics;
route archival policy;
payout linkage to route completion;




Zone Model — Foundation Rules

Zone in Logistics Center is modeled as a first-class geographic entity.

Zone purpose

Zones are used to:

segment logistics territory
support operational filtering of orders and routes
provide visual map context
bind SLA rules to geographic areas
enable territory-based analytics
act as a future input for payout calculations
Zone type

In MVP, Zone is strictly a geographic entity.

Operational tags or non-geographic segmentation may be introduced in future, but are not part of the core zone model.

Zone format

Primary and only supported format in MVP:

polygon-based geographic zones

Each zone is defined as a polygon on the map.

Zone assignment

Zone assignment follows a deterministic process:

If order has coordinates (lat/lng), zone is determined by polygon match.
If coordinates are missing, system attempts to geocode the address.
If geocoding fails or no zone is matched, the order remains without assigned zone.
Manual override

Zone override is allowed only at configuration level and only by Owner.

Dispatcher cannot manually override zone assignment.

Overlap rule

A single order must belong to at most one active zone.

If an order matches multiple zones, this is treated as a configuration error.

Zone configuration must avoid overlapping polygons.

Governance

Zone configuration is controlled at company level.

Only Owner role is allowed to:

create zones
edit zones
delete zones
apply manual zone override for specific orders
Zone assignment tracking

System should distinguish between:

automatically detected zone
final assigned zone after possible override

This ensures traceability and supports future analytics and debugging.

8. What we do not touch yet

Пока сознательно не трогаем:

UI редактор зон;
выбор map provider;
выбор geocoding provider;
versioning зон;
вложенные зоны;
автоматическое исправление overlap;
SLA формулы (только привязка);
payout формулы (только подготовка).








Payout Model — Foundation Rules

Courier payout in Logistics Center is based on configurable rule-based calculation.

Payout unit

The primary unit for payout calculation is Order.

Payout model

Payout is defined as a structured configuration, not as free-form formula.

The system uses a rule-based constructor approach.

Formula structure (MVP)

Payout may include:

base rate per order
optional distance-based component
failed delivery coefficient
optional zone-based modifiers
Inputs

Payout calculation may use:

order execution outcome
delivery distance
zone (if configured)
Calculation timing

Payout is calculated when the order reaches final execution outcome.

Immutability

Once calculated, payout is stored as immutable snapshot.

It must not be automatically recalculated after:

route changes
formula changes
zone changes
Failed delivery

Failed delivery payout is configurable:

zero payout
partial payout
Manual adjustment

Manual adjustment is allowed:

only by Owner
must be audited
applied as separate adjustment value
Period model

MVP supports payout accumulation and export.

No complex payroll closing logic is required.

8. What we do not touch yet

Пока не трогаем:

DSL формулы
бонусы/штрафы
shift-based payout
налоги
автоматическое закрытие периода
мультивалютные расчёты







Ниже готовый текст для документации.

Backend Architecture — MVP Module Map

Logistics Center backend is implemented as a modular monolith.

The system is built as a single deployable backend application with strict internal module boundaries.

This architecture is chosen for MVP because it provides:

lower operational complexity
faster development
simpler debugging
strong internal separation without premature microservice overhead
MVP backend modules
Platform modules
platform-system — system-level administration, tenant registry, super admin flows, impersonation control
companies — company entity and tenant-level foundational configuration
identity-access — authentication, actor identity, token/session model, RBAC enforcement primitives
users — tenant-level user management and role assignment
Core domain modules
couriers — courier operational entity and courier-related company data
orders — order domain, order stops, order lifecycle, protected order data logic
routes — route domain, route stops, route lifecycle, route composition and execution logic
zones — polygon-based geographic zones, zone matching, zone assignment support
payouts — payout rule configuration, payout calculation, payout snapshots, manual adjustments
Boundary and support modules
integrations — external system adapters, canonical mapping, webhook/polling orchestration, idempotency, outbound sync
audit — audit events, override logging, impersonation logging, sensitive action traceability
shared-infrastructure — technical shared primitives, database helpers, internal eventing helpers, geo/time/config utilities
Module boundary rules

Each module must keep its own business logic and must not become a dumping ground for unrelated functionality.

In particular:

orders owns order lifecycle and order protection rules
routes owns route lifecycle and route execution orchestration
integrations owns mapping and transport orchestration, but does not own order business logic
payouts owns payout calculation and snapshot storage, but does not own execution lifecycle
zones owns geographic matching and zone configuration, but not route execution
identity-access owns authentication and access-control primitives
audit records actions, but does not decide business rules
Dependency direction

The backend must enforce directional dependencies between modules.

Examples of intended dependencies:

users depends on companies
routes depends on orders and couriers
integrations depends on domain modules through application services
payouts depends on execution outcomes from orders, routes, and couriers
audit may be called by sensitive modules to record actions

Examples of prohibited dependency patterns:

orders must not depend on integrations
orders must not depend on payouts
routes must not depend on transport-specific integration logic
shared-infrastructure must not contain domain business rules
Internal module structure

Each backend module should follow a consistent internal structure with separated:

domain logic
application services
infrastructure adapters
interfaces / API layer
Not separate modules in MVP

The following concerns are intentionally not separated into standalone backend modules at MVP stage:

SLA engine
notifications
analytics
maps
realtime transport
billing

These may be introduced later when product and system complexity justify separate boundaries.

8. What we do not touch yet

Пока сознательно не трогаем:

конкретные DB таблицы по каждому модулю;
API endpoint map;
DTO contracts;
background jobs architecture;
deployment architecture;
folder structure and naming conventions;
implementation sequence.






Backend Implementation Order — Confirmed Delivery Strategy

Backend implementation for Logistics Center follows an infrastructure-first strategy.

This means development starts from technical and platform foundations before moving into full business execution flows.

The purpose of this strategy is to avoid rework in:

tenant isolation
authentication
RBAC
audit
shared infrastructure
module boundaries
Confirmed implementation waves
Wave 0 — Technical skeleton

Establish project skeleton, environment/config system, database connectivity, migration setup, shared error model, and application baseline.

Wave 1 — Platform foundation

Implement:

shared-infrastructure
platform-system
companies
identity-access
users
audit baseline
Wave 2 — Core operational entities

Implement:

couriers
zones
orders
Wave 3 — Route execution

Implement:

routes
Wave 4 — Integration layer

Implement:

integrations
Wave 5 — Payout layer

Implement:

payouts
Wave 6 — Hardening

Strengthen audit coverage, retries, reconciliation, support tooling, background jobs, exports, and operational resilience.

Confirmed exact module order
shared-infrastructure
platform-system
companies
identity-access
users
audit
couriers
zones
orders
routes
integrations
payouts
Delivery principle

Business vertical implementation must not bypass platform foundations.
Core operational flows are built only after tenant, identity, and access-control foundations are in place.

8. What we do not touch yet

Пока сознательно не трогаем:

DB schema breakdown per module;
entity/table map;
first sprint task pack for Claude;
endpoint design;
folder structure;
test strategy.






Database Schema Breakdown — Full MVP Scope (Finalized)

Database design for Logistics Center MVP is defined across both system schema and tenant schemas.

The model covers:

platform administration
company and user access
fixed-role RBAC storage
detailed audit and override tracking
courier operations
geographic zones
SLA-related configuration
orders and order stops
routes and route stops
integration contracts and event traceability
payout configuration and immutable payout snapshots
Identity and roles

Tenant users and couriers remain separate entities.

MVP uses fixed system-defined tenant roles, but role storage is normalized through:

roles
user_role_links

This does not introduce custom role composition in MVP.

Audit model

Audit is modeled in detail through:

audit_events
audit_entity_snapshots
audit_access_events
audit_override_events

This provides traceability for:

sensitive entity changes
access events
impersonation
overrides
payout adjustments
route changes during execution
Design rules
tenant operational tables should retain companyId where practical
history and snapshot tables are append-only
payout snapshots are immutable
configurable engines may use validated configJson
users and couriers remain separate
fixed roles are stored through normalized role linkage, not dynamic role composition
8. What we do not touch yet

Пока сознательно не трогаем:

exact Prisma schema syntax;
indexes and unique constraints matrix;
migration order;
soft delete policy;
archival/partitioning;
performance tuning.





Prisma Schema Planning — Wave 0–2

The Prisma planning scope is extended to cover Wave 0–2.

This includes:

system schema foundation
tenant identity and access foundation
baseline audit storage
core operational entities required before route execution
Included models
System schema
PlatformSuperAdmin
Company
PlatformImpersonationSession
PlatformAuditEvent
Tenant identity/access
User
Role
UserRoleLink
UserSession
Tenant audit
AuditEvent
AuditEntitySnapshot
AuditAccessEvent
AuditOverrideEvent
Tenant operational entities
Courier
Zone
ZoneAssignmentOverride
SlaRule
Order
OrderStop
OrderStatusHistory
Excluded from this Prisma scope
route models
integration models
payout models
advanced execution and support models
Planning rules
use singular English Prisma model names
keep stable enums only
use JSON only for approved flexible structures
preserve companyId on tenant models
keep audit and history models append-oriented
normalized fixed-role storage is allowed, but custom role composition remains خارج MVP
Recommended migration split
Migration 1: system + tenant identity/access + baseline audit
Migration 2: couriers + zones + SLA rules
Migration 3: orders + order stops + order status history + zone overrides
8. What we do not touch yet

Пока сознательно не трогаем:

exact Prisma syntax;
composite indexes and unique constraints;
route schema;
integration schema;
payout schema;
Claude implementation prompt wording.








AI Foundation — Decision Intelligence Layer (Finalized)

Logistics Center is designed as an AI-ready logistics platform.

In the first AI stage, AI acts strictly as a decision support layer, not as an autonomous owner of operational execution.

AI operating principle

AI may generate recommendations, but final operational decisions remain under human control.

This means:

AI suggests
dispatcher reviews
dispatcher accepts or rejects
deterministic domain logic remains the system of record

AI does not directly own:

order lifecycle
route lifecycle
zone assignment source of truth
payout source of truth
First-stage AI use cases

The foundation must support the following first-stage AI capabilities:

AI route suggestion — suggest route composition and stop sequence
AI courier assignment suggestion — suggest the most suitable courier for a route or delivery set
AI SLA risk prediction — predict likely SLA failure risk before or during operational flow
AI dispatcher copilot — provide contextual assistance and prioritization support for dispatcher decisions
Architectural boundary

AI must be implemented through a dedicated architectural layer, not as uncontrolled embedded logic in core domain modules.

Recommended backend module:

decision-intelligence

This module is responsible for:

recommendation generation orchestration
explanation and confidence handling
recommendation persistence
acceptance/rejection workflow
AI provider abstraction
AI execution traceability
Provider abstraction

The platform must not depend directly on a specific AI or geo-signal vendor inside domain logic.

AI-related integrations must use provider abstraction layers, including:

AI decision provider — for recommendation and copilot intelligence
Geo intelligence provider — for distance, travel time, traffic, and other external geospatial signals

Core domain modules must not call such providers directly.

Recommendation persistence

AI recommendations must be stored as first-class product entities.

The system must support storing:

recommendation type
target entity type
target entity id
proposed action or output
confidence / score
explanation
recommendation status
reviewer decision
timestamps
provider execution traceability

Recommended recommendation statuses:

proposed
accepted
rejected
dismissed
expired
Explainability and audit

All AI-driven recommendations must be explainable and auditable.

The system must be able to record:

what recommendation was generated
for which entity
based on which operational context
whether it was accepted or rejected
what final operational action followed
AI data readiness

The foundation must preserve normalized inputs suitable for AI and optimization layers, including:

orders
order stops
routes
couriers
zones
SLA rules
execution history
source freshness signals
external geo and travel-time provider outputs
Implementation note

AI support is part of the platform foundation, but the AI module is implemented only after core deterministic execution modules are stable.

Recommended implementation position:

after routes
after baseline integrations
before advanced optimization layers and later operational intelligence expansion
8. What we do not touch yet

Пока сознательно не трогаем:

конкретные AI провайдеры;
AI prompt design;
ML training pipeline;
ranking algorithms;
optimization solver choice;
feature store;
exact AI DB tables and Prisma models.









Backend Architecture — AI-ready Module Update

The backend module map is extended with a dedicated intelligence module:

decision-intelligence

This module is responsible for:

AI recommendation orchestration
route suggestion generation
courier assignment recommendation
SLA risk prediction outputs
dispatcher copilot support
provider abstraction for AI and geo intelligence
recommendation persistence
recommendation review workflow
AI execution traceability

This module does not own:

order lifecycle
route lifecycle
zone source of truth
payout source of truth

Core deterministic domain modules must remain functional even if the intelligence layer is disabled or unavailable.

Backend Implementation Order — AI-ready Update

The recommended implementation sequence is updated as follows:

shared-infrastructure
platform-system
companies
identity-access
users
audit
couriers
zones
orders
routes
integrations
decision-intelligence
payouts
hardening

The intelligence layer is intentionally implemented only after core deterministic operational modules and baseline integrations are stable.

Database Schema Breakdown — AI-ready Later-Wave Additions

The full MVP database skeleton reserves a later-wave decision intelligence block with the following tenant-level tables:

ai_recommendations
ai_recommendation_reviews
ai_execution_logs
ai_feature_settings

These tables are intended to support:

recommendation persistence
explanation storage
recommendation review and acceptance tracking
provider execution traceability
per-company AI governance

AI recommendation data must remain auditable and must not replace deterministic domain truth.

8. What we do not touch yet

Пока сознательно не трогаем:

exact Prisma syntax for AI tables;
AI provider contracts;
optimization algorithms;
prompt structures;
ranking/scoring formulas;
AI UI flows in detail.








Step 2 accepted
System schema foundation is operational.
Company is now read from system schema, tenant Prisma client is generated, and legacy public platform tables have been removed as part of an accepted destructive dev-reset baseline.
The project may proceed to Step 3: TenantProvisioningService planning.







Step 4 accepted

Authentication baseline is implemented and accepted.

Confirmed result:

tenant user login works
current user retrieval works
logout revokes tenant session
revoked tenant tokens are denied
super admin login baseline exists
request identity is resolved through authContext
tenant Prisma access now uses adapter-level schema selection instead of custom pool search-path hacks

This establishes the backend authentication boundary required for further protected modules.













Что уже сделано

Ниже отмечаю как СДЕЛАНО то, что уже можно считать закрытым или достаточно зрелым.

A. Product & domain foundation
1. Целевой сегмент и продуктовая рамка — СДЕЛАНО

Ты уже зафиксировал:

B2B SaaS
компании со своей доставкой
логисты, курьеры, владельцы/руководители
office-first MVP
2. MVP scope / out of scope — СДЕЛАНО

Границы MVP у тебя уже есть и они не выглядят хаотичными.

3. Multi-tenant модель — СДЕЛАНО

Зафиксировано:

single database
system schema
отдельная tenant schema per company
Super Admin через system layer
4. Core domain model — СДЕЛАНО

Зафиксировано:

Order
OrderStop
Route
RouteStop
Courier
Zone
и их ключевые связи
5. Order lifecycle — СДЕЛАНО

Зафиксировано:

planning
assigned
in_execution
completed
delivery_failed
execution boundary
external status vs internal status
6. Route lifecycle — СДЕЛАНО

Зафиксировано:

draft
assigned
in_execution
completed
controlled edits in execution
propagation to orders
7. Zone model — СДЕЛАНО

Зафиксировано:

Zone = geographic entity
polygon
auto assignment
manual fallback governance
overlap = config error
zone usage in filters/SLA/analytics/UI
8. Payout model — СДЕЛАНО

Зафиксировано:

rule-based configurable model
payout unit = order
immutable snapshots
failed delivery handling
manual adjustment
accumulation/export baseline
9. Integration contract — СДЕЛАНО

Зафиксировано:

canonical contract
webhook preferred, polling supported
API key + HMAC
upsert
ownership boundary before/after execution
outbound minimal sync
10. RBAC / permissions model — СДЕЛАНО

Зафиксировано:

Owner
Dispatcher
Viewer
Super Admin
matrix by resource/action
11. Source-of-truth rules CRM vs LC — СДЕЛАНО

Зафиксировано:

до execution CRM updates можно принимать
после execution LC защищает execution context
12. AI role in product foundation — СДЕЛАНО

Зафиксировано:

AI = recommendation layer
human approval first
use cases определены
provider abstraction обязателен
AI persistence/audit/explainability нужны
B. Technical / architecture foundation
13. Backend architecture style — СДЕЛАНО

modular monolith

14. Module map — СДЕЛАНО

Модули уже определены, включая AI-ready update.

15. Dependency rules between modules — СДЕЛАНО

Направления зависимостей зафиксированы.

16. Implementation order / wave sequence — СДЕЛАНО

infrastructure-first уже подтверждён.

17. DB high-level model — СДЕЛАНО

Полный MVP data skeleton уже определён концептуально.

18. Auth model — СДЕЛАНО

Концептуально и уже частично в коде.

19. Session / revocation model — СДЕЛАНО

Зафиксирован и уже реализован baseline.

20. Audit model — СДЕЛАНО

На уровне foundation и data skeleton — да.

21. Tenant provisioning model — СДЕЛАНО

Архитектурно и уже реализован baseline.

22. Tenant runtime access strategy — СДЕЛАНО

Через tenant-aware Prisma access с schema selection.

23. Prisma / schema strategy — СДЕЛАНО

Разделение:

system.prisma
tenant.prisma
legacy public layer
24. Baseline error/config/infrastructure conventions — СДЕЛАНО

На базовом уровне уже есть:

config
error model
Prisma baseline
compile sanity
C. Delivery / implementation foundation
25. Safe first implementation scope — СДЕЛАНО

Wave 0–1 был ограничен и выдержан.

26. Working platform baseline in code — СДЕЛАНО

Есть system schema, company foundation, tenant provisioning baseline.

27. Working auth baseline in code — СДЕЛАНО

Login/logout/me, session revocation, authContext baseline — есть.

28. Working tenant provisioning in code — СДЕЛАНО

Есть.

29. Clean compile/build baseline — СДЕЛАНО

tsc --noEmit чистый — это важный маркер зрелости.

30. Clear next-wave plan — ЧАСТИЧНО СДЕЛАНО

Высокоуровнево да. Но следующий продуктовый/технический шаг ещё надо упаковать в конкретную очередь работ.

3. Что ещё осталось сделать

Вот здесь важно разделить:
что реально нужно, а что уже пошло бы в бесконечные улучшения.

Оставшиеся обязательные вещи перед спокойной дальнейшей разработкой
1. Users Management module — ОСТАЛОСЬ

Сейчас auth baseline есть, но у тебя ещё нет полноценного tenant user management flow.

Нужно:

create user
assign one active role
list users
update/deactivate user
owner-only management rules

Почему это важно:
без этого продукт technically стартанул, но tenant admin lifecycle ещё не закрыт.

2. Platform super admin endpoints baseline — ОСТАЛОСЬ

Нужен минимальный platform control layer:

list companies
create company
maybe activate/suspend company
позже impersonation

Почему важно:
иначе system layer архитектурно есть, но operationally не завершён.

3. Impersonation flow baseline — ОСТАЛОСЬ

Концептуально он описан, но рабочий flow ещё не собран.

Нужно:

explicit enter tenant context
audit
exit
strict boundary

Почему важно:
это часть платформенной зрелости multi-tenant SaaS.

4. Users + auth + provisioning together as one real happy path — ОСТАЛОСЬ

Нужно довести до end-to-end сценария:

Super Admin создаёт компанию
provisioning создаёт tenant schema
Owner user создаётся
Owner может войти
Owner может видеть me
Owner может создать/управлять user’ами

Сейчас куски уже есть, но полный platform happy path ещё не закрыт как единый сценарий.

5. Legacy/public cleanup strategy — ОСТАЛОСЬ

Пока у тебя ещё есть transitional слой:

legacy schema.prisma
legacy Order/Courier/AuditLog

Это нормально на текущей стадии, но нужен явный план, как этот слой будет убран позже.

Что нужно:

не убирать сейчас
но зафиксировать как debt item, а не как “ну потом как-нибудь”
6. Wave 2 entry criteria — ОСТАЛОСЬ

Перед тем как идти в orders/routes дальше, нужно письменно определить:

что считается достаточным, чтобы начать Wave 2;
какой первый operational vertical идёт;
какие модули являются gate.

Иначе вы снова начнёте двигаться “по ощущениям”.

Очень желательно, но не обязательно прямо сейчас

Эти вещи полезны, но не должны тормозить старт разработки дальше.

7. RouteStop deeper model — ПОЗЖЕ

Можно добрать позже.

8. Full SLA engine — ПОЗЖЕ

Сейчас у тебя есть SLA rules/config level. Этого достаточно.

9. AI DB schema / exact AI tables — ПОЗЖЕ

В фундамент AI уже встроен. Таблицы можно делать потом.

10. Full payout exports / settlement details — ПОЗЖЕ

Базовая payout foundation уже есть.

11. Full tenant migration runner — ПОЗЖЕ

На текущем этапе provisioning baseline хватает.

12. Observability / metrics / retries / reconciliation depth — ПОЗЖЕ

Нужно, но это уже не foundation gate.