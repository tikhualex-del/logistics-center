Слой 2 — Техническая спецификация
PROJECT: Логистический центр
🔐 МОДУЛЬ 1: Аутентификация и пользователи
1. User Stories
US-1 Регистрация
Как администратор компании, я хочу создать аккаунт компании, чтобы начать использовать систему
US-2 Логин
Как пользователь, я хочу войти в систему по email/password
US-3 Роли
Как администратор, я хочу назначать роли (admin, dispatcher, courier)
US-4 Безопасность
Как система, я должна изолировать данные компаний (multi-tenant)
2. Модель данных

users

id: uuid (PK)
company_id: uuid (FK)
email: text (unique, not null)
password_hash: text
role: enum (admin, dispatcher, courier)
full_name: text
created_at: timestamp

companies

id: uuid
name: text
created_at: timestamp
3. API
POST /auth/register
POST /auth/login
GET /users/me
POST /users (создать пользователя)
4. UI / компоненты
страница логина
страница регистрации
управление пользователями
5. Бизнес-логика
email уникален
пароль хешируется
доступ по ролям (RBAC)
6. Крайние случаи
пользователь из другой компании не видит данные
неправильный пароль → 401
невалидный токен → logout
📦 МОДУЛЬ 2: Заказы
1. User Stories
US-1 Импорт заказов
Как система, я принимаю заказы из CRM через API
US-2 Управление заказами
Как логист, я вижу список заказов
US-3 Статусы
Как курьер, я меняю статус заказа
2. Модель данных

orders

id: uuid
company_id: uuid
address: text
lat: float
lng: float
zone_id: uuid
weight: float
status: enum
delivery_time_from: timestamp
delivery_time_to: timestamp
created_at: timestamp
3. API
POST /orders (из CRM)
GET /orders
PATCH /orders/:id/status
4. UI
таблица заказов
фильтры
карта заказов
5. Бизнес-логика
заказ должен иметь координаты
статусы переходят по цепочке
6. Edge cases
неверный адрес → ошибка геокодинга
заказ без координат → не маршрутизируется
🗺 МОДУЛЬ 3: Маршруты
1. User Stories
US-1 Авто-маршрут
Как логист, я хочу построить маршрут автоматически
US-2 Ручная правка
Как логист, я могу менять маршрут
2. Модель данных

routes

id
courier_id
total_distance
total_time

route_points

id
route_id
order_id
sequence
3. API
POST /routes/build
GET /routes
PATCH /routes/:id
4. UI
карта маршрута
drag&drop точек
5. Бизнес-логика
маршруты строятся через API карт
учитываются зоны
6. Edge cases
перегруз курьера
нарушение SLA
🚚 МОДУЛЬ 4: Курьеры
1. User Stories
видеть список курьеров
видеть их локацию
видеть загрузку
2. Модель данных

couriers

id
user_id
status (online/offline)
current_lat
current_lng
3. API
GET /couriers
PATCH /couriers/status
4. UI
карта с курьерами
5. Бизнес-логика
обновление GPS каждые N секунд
6. Edge cases
потеря сигнала
💰 МОДУЛЬ 5: Мотивация и выплаты
1. User Stories
US-1 Настройка оплаты
Как руководитель, я хочу задать правила оплаты
US-2 Расчёт выплат
Как система, я считаю выплаты автоматически
US-3 Прозрачность
Как курьер, я вижу, как посчитаны деньги
2. Модель данных

payment_rules

id
type (zone/km/bonus)
value
conditions

payments

id
courier_id
amount
breakdown (json)
3. API
POST /payment-rules
GET /payments
4. UI
конструктор правил
экран выплат
5. Бизнес-логика
сумма = зона + км + бонусы
6. Edge cases
конфликт правил
пересчёт выплат
📊 МОДУЛЬ 6: Аналитика
1. User Stories
видеть стоимость доставки
видеть эффективность
2. Данные
агрегаты из orders + routes + payments
3. API
GET /analytics
4. UI
дашборды
5. Логика
расчёт KPI
6. Edge cases
нет данных
🤖 МОДУЛЬ 7: AI помощник
1. User Stories
“почему выросли расходы?”
“кто неэффективен?”
2. Data
аналитика
3. API
POST /ai/query
4. Логика
LLM + данные
5. Edge cases
нет данных → нет ответа
📱 МОДУЛЬ 8: Мобильное приложение
1. User Stories
видеть маршрут
менять статус
2. API
GET /my-route
POST /status
3. UI
список заказов
карта
4. Логика
синхронизация
5. Edge cases
offline режим