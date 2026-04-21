# FEAT-048 v1 — Frontend Output: register-page-form

## Summary
Реализована страница /register с формой регистрации нового аккаунта. Визуальный стиль точно повторяет login-screen.tsx. Форма работает в preview-mode: данные не отправляются на API, создаётся локальный preview-пользователь с ролью admin. Login и register страницы связаны навигационными ссылками.

## Pages / Components

### frontend/src/lib/constants.ts (modified)
- Добавлена константа `REGISTER: '/register'` в объект ROUTES

### frontend/src/features/auth/register-screen.tsx (new)
- Новый компонент RegisterScreen
- Двухколоночный layout: lg:grid-cols-[1.12fr_0.88fr], идентичный login
- Тот же фон: bg-[#f2eadc] + radial gradients + grid overlay
- Левая панель с тремя feature-highlight карточками (Building2, Users, ShieldCheck icons)
- Нижняя тёмная карточка bg-slate-950 "Что создаётся при регистрации"
- Правая панель: форма с Zod-валидацией
- Поля: firstName + lastName (grid 2-col), companyName, email (с MailLine icon), password (с LockLine icon + toggle)
- Preview-mode: onSubmit создаёт AuthUser {role: 'admin'} через setAuth, navigates to /dispatcher
- Guard: isAuthenticated → Navigate to ROUTES.DISPATCHER
- Ссылка "Уже есть аккаунт? Войти" → ROUTES.LOGIN

### frontend/src/pages/app-router.tsx (modified)
- Добавлен lazy import RegisterPage
- Добавлен Route path={ROUTES.REGISTER}

### frontend/src/features/auth/login-screen.tsx (modified)
- Добавлен import Link from react-router-dom
- Footer заменён: текст "Нет открытой регистрации..." → ссылка "Нет аккаунта? Зарегистрироваться" → ROUTES.REGISTER

## Key UI decisions
- firstName и lastName объединены в одну строку (grid 2-col) для экономии пространства
- lastName помечен как необязательный прямо в label (без отдельного hint)
- Иконки MailLine и LockLine дублированы inline (не импортированы) — приемлемо для MVP, рефакторинг в auth-utils позже
- Preview-notice блок сообщает пользователю что данные не уходят на сервер
- Badge в правой панели — Building2 icon вместо LockKeyhole (семантически верно для регистрации)

## API integration
- Нет. Preview-mode, API подключается в task 6.2c.
- Zod schema соответствует backend RegisterDto: password min(8), firstName required, lastName optional, companyName required

## State management
- Zustand auth store: setAuth(user, token) — единственная запись состояния
- Нет TanStack Query (нет API calls в preview-mode)

## UX considerations
- Это auth-экран, не dispatcher. Map-first принцип не применяется.
- Все поля видны сразу, нет скрытых шагов
- Loading state: кнопка показывает "Создаём аккаунт..." пока isSubmitting
- Error state: inline под каждым полем
- Responsive: на mobile показывается только правая колонка с формой

## TypeScript
- `tsc --noEmit` прошёл без ошибок

## Runtime artifacts
- outputs: agent-runtime/outputs/FEAT-048-v1-frontend.md
