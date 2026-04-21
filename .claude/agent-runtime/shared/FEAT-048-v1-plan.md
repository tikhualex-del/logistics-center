# FEAT-048 v1 — Plan: register-page-form

## Goal
Создать страницу `/register` с формой регистрации нового аккаунта (email, password, firstName, lastName, companyName). Форма должна точно повторять визуальный стиль login-screen.tsx и работать в preview-режиме до подключения реального API (task 6.2c). Также нужно связать login и register страницы навигационными ссылками.

## Task type
new feature (frontend-only enhancement)

## Affected domains
- `auth` (frontend) — новый экран регистрации, preview-flow
- `routing` (frontend) — добавление route /register
- `constants` (frontend) — добавление REGISTER в ROUTES

## Data changes
- Нет изменений в БД
- Нет изменений в Prisma schema
- Auth store достаточен как есть — setAuth принимает AuthUser и token

## API changes
- Нет новых backend endpoint (POST /api/v1/auth/register уже существует, будет подключён в task 6.2c)
- Нет изменений в существующем API

## Backend tasks
- Нет. Backend уже готов.

## Frontend tasks

### 1. constants.ts — добавить REGISTER route
- Добавить `REGISTER: '/register'` в объект ROUTES в `frontend/src/lib/constants.ts`

### 2. Создать register-screen.tsx
Файл: `frontend/src/features/auth/register-screen.tsx`

Структура идентична login-screen.tsx:
- Двухколоночный layout: lg:grid-cols-[1.12fr_0.88fr]
- Тот же фон: bg-[#f2eadc] + radial gradients + grid overlay
- Левая панель (hidden на mobile, flex на lg+):
  - Badge "onboarding setup" (вместо "dispatch terminal")
  - Заголовок: "Запустите свою логистику за несколько минут."
  - Подзаголовок: Phase 6.2b
  - 3 feature-highlight карточки (onboarding-ориентированные):
    - "Ваш тенант за минуту" — иконка Building2 — "Создайте компанию и пригласите команду без длинного онбординга."
    - "Роли с первого дня" — иконка Users — "Разграничение доступа администратора, диспетчера и курьера настраивается сразу."
    - "Изоляция данных" — иконка ShieldCheck — "Все данные вашей компании полностью изолированы от других тенантов платформы."
  - Нижний блок (тёмная карточка, как в login):
    - Заголовок: "Что создаётся при регистрации"
    - 3 пункта:
      - "Аккаунт администратора компании"
      - "Изолированный тенант в мультитенант-платформе"
      - "Доступ к диспетчерскому workspace сразу после входа"

- Правая панель (форма):
  - Тот же стиль карточки: rounded-[2rem], border border-white/60, bg-[linear-gradient(...)], shadow, backdrop-blur
  - Badge: "secure registration" (IBM Plex Mono, uppercase, tracking)
  - Заголовок: "Создать аккаунт"
  - Preview-notice (аналог credentials block в login): объясняет preview-mode
  - Форма с полями в порядке:
    1. firstName (required) — Label "Имя", placeholder "Алексей"
    2. lastName (optional) — Label "Фамилия (необязательно)", placeholder "Иванов"
    3. companyName (required) — Label "Название компании", placeholder "ООО Экспресс Доставка"
    4. email (required) — Label "Рабочий email", placeholder "admin@company.com", иконка MailLine
    5. password (required, min 8) — Label "Пароль", toggle show/hide, иконка LockLine
  - Кнопка submit: "Создать аккаунт" → "Создаём аккаунт..." (isSubmitting)
  - Ссылка внизу: "Уже есть аккаунт? Войти" → ROUTES.LOGIN
  - Footline: ссылка на условия (статичный текст, не активная ссылка)

### 3. Zod schema
```typescript
const registerSchema = z.object({
  email: z.string().email('Введите валидный email'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
  firstName: z.string().min(1, 'Введите ваше имя'),
  lastName: z.string().optional(),
  companyName: z.string().min(1, 'Введите название компании'),
})
```

### 4. Preview-mode onSubmit
```typescript
const onSubmit = async (data: RegisterFormData): Promise<void> => {
  await new Promise((resolve) => { window.setTimeout(resolve, 520) })
  setAuth(buildPreviewUser(data), 'preview-access-token')
  navigate(ROUTES.DISPATCHER)
}
```
buildPreviewUser принимает RegisterFormData и возвращает AuthUser с role: 'admin' (регистрирующийся — владелец компании).

### 5. app-router.tsx — добавить route /register
```typescript
const RegisterPage = lazy(() => import('@/features/auth/register-screen'))
// В Routes:
<Route path={ROUTES.REGISTER} element={<RegisterPage />} />
```
Добавить redirect guard: если isAuthenticated → Navigate to ROUTES.DISPATCHER.

### 6. login-screen.tsx — добавить ссылку на /register
Заменить нижний блок:
```
"Нет открытой регистрации в этой фазе. Следующим шагом пойдёт отдельная страница onboarding."
```
На:
```tsx
<span>Нет аккаунта?</span>
<Link to={ROUTES.REGISTER} className="...">Зарегистрироваться</Link>
```

## Security checks
- Нет multi-tenant рисков — чисто frontend страница
- Preview-mode не отправляет данные на сервер
- password min 8 chars соответствует backend RegisterDto
- isAuthenticated guard предотвращает доступ к /register для авторизованных

## Test scope
- Unit: Zod schema validation (email format, password min 8, firstName required, lastName optional, companyName required)
- Integration: нет (preview-mode, нет API calls)
- Edge cases: пустые обязательные поля, пароль 7 символов (должен отклоняться), пароль 8 символов (должен проходить)

## Risks
- Низкий: визуальное несоответствие login-screen — решается точным копированием CSS-классов
- Низкий: дублирование вспомогательных функций (buildPreviewUser, MailLine, LockLine) — приемлемо для MVP, рефакторинг в auth-utils позже

## Recommended implementation order
1. `frontend/src/lib/constants.ts` — добавить REGISTER route
2. `frontend/src/features/auth/register-screen.tsx` — создать экран регистрации
3. `frontend/src/pages/app-router.tsx` — добавить lazy route /register
4. `frontend/src/features/auth/login-screen.tsx` — заменить footer-текст на ссылку /register

## Runtime artifacts
- shared: agent-runtime/shared/FEAT-048-v1-plan.md
