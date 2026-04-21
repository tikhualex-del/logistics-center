# FEAT-018-v1-plan.md
# Auth Module: Register / Login / Refresh / Logout

**Feature ID:** FEAT-018
**Version:** v1
**Tasks covered:** 2.1a (Auth controller), 2.1b (Auth service), 2.1c (JWT + Refresh strategies), 2.1d (Auth DTOs)

---

## Goal

Реализовать полный auth flow для Logistics Center: регистрация компании+пользователя, вход, обновление токена, выход. Это core MVP functionality (CLAUDE.md §18) — security-sensitive модуль, база для всего RBAC и tenant isolation.

## Task type

New feature (security-sensitive, multi-tenant core)

## Scope decision

**Задачи 2.1a + 2.1b + 2.1c + 2.1d реализуются как единый feature-scope FEAT-018.**

Обоснование: auth-контроллер (2.1a) технически неотделим от auth-сервиса (2.1b), JWT/refresh стратегий (2.1c) и DTOs (2.1d) — они взаимозависимы и не компилируются по отдельности. Разбивка по отдельным фичам создаёт временно несвязанный код. Правильное решение — реализовать все четыре задачи одним pipeline.

**Не входит в FEAT-018 (следующие фичи):**
- 2.2a JwtAuthGuard — реализуется после, использует стратегии из 2.1c
- 2.2b TenantGuard — реализуется после 2.2a
- 2.2c RolesGuard — реализуется после 2.2a
- 2.2d PermissionsGuard — реализуется после 2.2a
- 2.3 Users module — реализуется после 2.2d
- 2.4 Companies module — реализуется после 1.2 (отдельный pipeline)
- 2.5 Decorators (@CurrentUser, @Roles, @RequirePermission, @Public)

Архитектура FEAT-018 должна предусматривать подключение Guards (2.2a-d) и декораторов (2.5) без изменения AuthModule.

## Affected domains

- `auth` — основной домен
- `companies` — при регистрации создаётся новая компания
- `audit` — логирование событий register/login/logout

## Data changes

Новых таблиц не требуется — схема уже создана в FEAT-008:
- `users` — хранит `password_hash`, `last_login_at`, `is_active`, `company_id`, `role`
- `companies` — создаётся при регистрации
- `audit_logs` — запись событий auth

Нет необходимости в отдельной таблице refresh токенов на MVP (токен верифицируется по подписи + компании; при logout — stateless через TTL). Если нужен явный revoke — Phase 2.

## API changes

### New endpoints (all under `/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Регистрация компании + первого admin-пользователя |
| POST | `/api/v1/auth/login` | Public | Вход, получение access token + установка refresh cookie |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Обновление access token |
| POST | `/api/v1/auth/logout` | JWT access | Выход, очистка refresh cookie |

**Response envelope:** все ответы оборачиваются в `{ data, meta: { requestId, timestamp } }` через существующий `ResponseEnvelopeInterceptor`.

**Rate limiting:** уже настроен глобально через `AppThrottlerGuard` (FEAT-015). Публичные endpoints `/auth/register`, `/auth/login` покрыты автоматически.

## Backend tasks

### 1. Auth DTOs (2.1d)
**File:** `backend/src/modules/auth/dto/register.dto.ts`
```
RegisterDto:
  - email: string (@IsEmail, @IsNotEmpty)
  - password: string (@IsString, @MinLength(8), @MaxLength(72))
  - firstName: string (@IsString, @IsNotEmpty, @MaxLength(100))
  - lastName?: string (@IsOptional, @IsString, @MaxLength(100))
  - companyName: string (@IsString, @IsNotEmpty, @MaxLength(255))
```

**File:** `backend/src/modules/auth/dto/login.dto.ts`
```
LoginDto:
  - email: string (@IsEmail, @IsNotEmpty)
  - password: string (@IsString, @IsNotEmpty)
```

**File:** `backend/src/modules/auth/dto/token-response.dto.ts`
```
TokenResponseDto:
  - accessToken: string
  - user: { id, email, firstName, lastName, role, companyId }
```

### 2. Auth Service (2.1b)
**File:** `backend/src/modules/auth/auth.service.ts`

Methods:
- `register(dto: RegisterDto): Promise<TokenResponseDto>`
  - Проверить уникальность email внутри новой компании (email глобально уникален на этапе регистрации — поле @@unique([company_id, email]) в схеме)
  - Проверить, что email ещё не используется ни в одной компании (для регистрации компании)
  - Создать `Company` в транзакции
  - Хешировать пароль: `bcrypt.hash(password, 12)`
  - Создать `User` с role=admin в той же транзакции
  - Записать в audit_logs: action='user.registered', entity_type='user'
  - Вернуть access token + информацию о пользователе

- `login(dto: LoginDto): Promise<{ accessToken: string; user: UserPayload; refreshToken: string }>`
  - Найти User по email (поиск по всем компаниям — email уникален глобально при регистрации, но Prisma схема имеет @@unique по company_id+email)
  - Примечание: для login нужно искать по email без company_id (public endpoint). Использовать `prisma.user.findFirst({ where: { email } })`.
  - Проверить `is_active`
  - Проверить пароль: `bcrypt.compare(plain, hash)`
  - Обновить `last_login_at`
  - Сгенерировать access token (JWT, 15m, payload: { sub: userId, companyId, role, email })
  - Сгенерировать refresh token (JWT, 30d, payload: { sub: userId, companyId })
  - Записать в audit_logs: action='user.logged-in'
  - Вернуть токены

- `logout(userId: string, companyId: string): Promise<void>`
  - Записать в audit_logs: action='user.logged-out'
  - (stateless JWT — реальный revoke в Phase 2)

- `refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>`
  - Верифицировать refresh token через `jwtService.verify(token, { secret: REFRESH_SECRET })`
  - Найти User по payload.sub
  - Проверить `is_active`
  - Сгенерировать новую пару токенов (refresh rotation)
  - Вернуть новые токены

- `validateUser(userId: string, companyId: string): Promise<User | null>` — используется стратегиями

### 3. JWT Strategy (2.1c)
**File:** `backend/src/modules/auth/strategies/jwt.strategy.ts`

- Extends `PassportStrategy(Strategy, 'jwt')`
- Extracts Bearer token from Authorization header
- Verifies with `JWT_SECRET`
- Calls `authService.validateUser(payload.sub, payload.companyId)`
- Returns user object (attached to `req.user`)

### 4. Refresh Strategy (2.1c)
**File:** `backend/src/modules/auth/strategies/refresh.strategy.ts`

- Extends `PassportStrategy(Strategy, 'jwt-refresh')`
- Extracts token from httpOnly cookie `refreshToken`
- Verifies with `JWT_REFRESH_SECRET`
- Returns decoded payload (attached to `req.user`)
- Используется только для `POST /auth/refresh` endpoint

### 5. Auth Controller (2.1a)
**File:** `backend/src/modules/auth/auth.controller.ts`

```
@Controller('auth')
@ApiTags('auth')
class AuthController:

  POST /register — @Public() (не требует JWT)
    - принимает RegisterDto
    - вызывает authService.register()
    - возвращает TokenResponseDto (без refresh в теле — access token в теле, refresh в cookie)
    - устанавливает refreshToken cookie (httpOnly, secure в prod, sameSite: strict, maxAge: 30d)

  POST /login — @Public()
    - принимает LoginDto
    - вызывает authService.login()
    - устанавливает refreshToken cookie
    - возвращает TokenResponseDto

  POST /refresh — @UseGuards(AuthGuard('jwt-refresh'))
    - читает refresh token из cookie (через guard/strategy)
    - вызывает authService.refreshTokens()
    - обновляет refreshToken cookie (rotation)
    - возвращает новый accessToken

  POST /logout — @UseGuards(AuthGuard('jwt'))
    - вызывает authService.logout(req.user.sub, req.user.companyId)
    - очищает refreshToken cookie (maxAge: 0)
    - возвращает { message: 'Logged out' }
```

**Примечание:** `@Public()` декоратор будет реализован в задаче 2.5. В контексте этой фичи контроллер использует `@UseGuards(AuthGuard('jwt'))` явно там где нужно, и просто не имеет guard там где endpoint публичный (т.к. глобальный JwtAuthGuard ещё не настроен — это задача 2.2a). Такой подход безопасен в рамках данной фичи — после реализации 2.2a и 2.5 декоратор @Public() будет добавлен к register/login.

### 6. Auth Module (сборка)
**File:** `backend/src/modules/auth/auth.module.ts`

```
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

### 7. AppModule integration
Добавить `AuthModule` в imports AppModule (`backend/src/app.module.ts`).

### 8. Audit logging
В `auth.service.ts` использовать `PrismaService` напрямую для записи в `audit_logs`:
```typescript
await this.prisma.auditLog.create({
  data: {
    company_id: companyId,
    actor_id: userId,
    actor_role: AuditActorRole.admin, // or user.role
    action: 'user.logged-in',
    entity_type: 'user',
    entity_id: userId,
    before: null,
    after: { email, last_login_at },
    timestamp: new Date(),
  }
})
```
Примечание: AuditService (task 3.5) ещё не реализован. Прямая запись через PrismaService допустима в рамках этого MVP шага. После реализации 3.5 можно заменить на event-based подход.

### 9. Environment variables required
Проверить наличие в `.env.example`:
- `JWT_SECRET` — секрет для access токенов
- `JWT_REFRESH_SECRET` — секрет для refresh токенов

## Frontend tasks

Не входит в scope FEAT-018 (backend-only pipeline).

Frontend auth UI (6.2a, 6.2b, 6.2c, 6.2d) реализуется в Phase 6 после завершения backend auth.

## Security checks

1. **Пароли:** bcrypt с rounds=12 (достаточно для MVP, баланс скорости/безопасности)
2. **JWT secrets:** берутся из `ConfigService`/env, не хардкодятся
3. **Refresh token:** httpOnly cookie (недоступен JS), secure=true в production, sameSite=strict
4. **Refresh rotation:** при каждом обновлении выдаётся новый refresh token (старый становится невалидным через TTL)
5. **Company isolation:** companyId в JWT payload — контроллер не принимает companyId из body/params
6. **Login поиск:** `findFirst` по email — возвращает ошибку "invalid credentials" (не раскрывает существование email)
7. **Rate limiting:** уже настроен глобально через AppThrottlerGuard (100 req/60s)
8. **Validation:** class-validator на всех DTOs через глобальный AppValidationPipe
9. **Password max length 72:** bcrypt игнорирует байты после 72 — явный @MaxLength(72)
10. **Audit trail:** все события auth (register, login, logout) записываются в audit_logs

## Test scope

### Unit tests
- `auth.service.spec.ts`:
  - `register()`: успешная регистрация, дублирующийся email, слабый пароль
  - `login()`: успешный вход, неверный пароль, неактивный пользователь, несуществующий email
  - `refreshTokens()`: валидный refresh, истёкший refresh, невалидная подпись
  - `logout()`: запись в audit_logs

### Integration tests (Phase 9 — task 9.1a)
- POST /auth/register → 201, cookie установлен, access token в ответе
- POST /auth/login → 200, cookie установлен
- POST /auth/refresh → 200 (с валидным cookie), 401 (без cookie)
- POST /auth/logout → 200, cookie очищен
- POST /auth/login с неверным паролем → 401
- POST /auth/register с существующим email → 409

## Risks

1. **Email uniqueness:** Схема имеет @@unique([company_id, email]), но для login нужен поиск по email без company_id. `findFirst` вернёт первый matching user — это нормально, т.к. при регистрации компании email уникален глобально (проверяется вручную в сервисе).
2. **Refresh token stateless revoke:** В MVP нет возможности revoke до истечения TTL. При logout токен технически остаётся валидным 30 дней. Это MVP trade-off, документируется. Phase 2: хранить refresh tokens в Redis с возможностью инвалидации.
3. **cookie secure в dev:** в development `secure: false` (HTTP), в production `secure: true`. Контролируется через `NODE_ENV`.
4. **AuditModule не готов:** прямая запись в audit_logs через PrismaService — технический долг, заменяется в task 3.5.

## Recommended implementation order

1. **Auth DTOs** (`register.dto.ts`, `login.dto.ts`, `token-response.dto.ts`) — нет зависимостей
2. **Auth Service** (`auth.service.ts`) — зависит от DTOs + PrismaService
3. **JWT Strategy** (`strategies/jwt.strategy.ts`) — зависит от AuthService + ConfigService
4. **Refresh Strategy** (`strategies/refresh.strategy.ts`) — зависит от ConfigService
5. **Auth Controller** (`auth.controller.ts`) — зависит от AuthService + стратегий
6. **Auth Module** (`auth.module.ts`) — собирает всё
7. **AppModule** — добавить AuthModule в imports
8. **Unit tests** (`auth.service.spec.ts`) — параллельно или после сервиса
9. **Verify .env.example** — JWT_SECRET, JWT_REFRESH_SECRET

## Runtime artifacts

- shared: .claude/agent-runtime/shared/FEAT-018-v1-plan.md
