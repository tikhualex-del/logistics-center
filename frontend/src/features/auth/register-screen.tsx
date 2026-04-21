import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib'
import { useRegisterMutation } from './use-auth-mutations'
import { extractApiErrorMessage } from '@/api/auth.api'

const registerSchema = z.object({
  email: z.string().email('Введите валидный email'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
  firstName: z.string().min(1, 'Введите ваше имя'),
  lastName: z.string().optional(),
  companyName: z.string().min(1, 'Введите название компании'),
})

type RegisterFormData = z.infer<typeof registerSchema>

const featureHighlights = [
  {
    title: 'Ваш тенант за минуту',
    description:
      'Создайте компанию и пригласите команду без длинного онбординга.',
    icon: Building2,
  },
  {
    title: 'Роли с первого дня',
    description:
      'Разграничение доступа администратора, диспетчера и курьера настраивается сразу.',
    icon: Users,
  },
  {
    title: 'Изоляция данных',
    description:
      'Все данные вашей компании полностью изолированы от других тенантов платформы.',
    icon: ShieldCheck,
  },
] as const

const onboardingChecklist = [
  'Аккаунт администратора компании',
  'Изолированный тенант в мультитенант-платформе',
  'Доступ к диспетчерскому workspace сразу после входа',
] as const

export function RegisterScreen(): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      companyName: '',
    },
  })

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    await registerMutation.mutateAsync(data)
  }

  // Auth redirect is handled at router level by PublicRoute — no inline check needed here.

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2eadc] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(190,106,50,0.18),_transparent_32%),radial-gradient(circle_at_78%_22%,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.74),_rgba(242,234,220,0.94))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
        {/* Left panel — feature highlights */}
        <section className="hidden px-8 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-950/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c76b38]" />
              <span
                className="text-[11px] uppercase tracking-[0.28em] text-slate-600"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                }}
              >
                onboarding setup
              </span>
            </div>

            <div className="mt-10 space-y-6">
              <p
                className="text-sm uppercase tracking-[0.3em] text-slate-500"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                }}
              >
                Phase 6.2b
              </p>
              <h1
                className="max-w-xl text-5xl leading-[0.96] text-slate-950 xl:text-6xl"
                style={{
                  fontFamily:
                    "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif",
                }}
              >
                Запустите свою логистику за несколько минут.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 xl:text-lg">
                Регистрация создаёт аккаунт администратора и изолированный
                тенант вашей компании. Сразу после входа открывается
                диспетчерское рабочее поле.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {featureHighlights.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-[1.75rem] border border-slate-950/10 bg-white/68 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-[#f2eadc]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2
                    className="mt-5 text-lg text-slate-950"
                    style={{
                      fontFamily:
                        "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif",
                    }}
                  >
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="max-w-2xl rounded-[2rem] border border-slate-950/10 bg-slate-950 px-6 py-5 text-[#f3ebde] shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.24em] text-[#d2bba7]"
                  style={{
                    fontFamily:
                      "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                  }}
                >
                  account setup
                </p>
                <p
                  className="mt-2 text-2xl"
                  style={{
                    fontFamily:
                      "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif",
                  }}
                >
                  Что создаётся при регистрации
                </p>
              </div>
              <div className="hidden rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#d2bba7] sm:block">
                live
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {onboardingChecklist.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-[#f5efe6]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right panel — registration form */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-x-8 top-6 h-40 rounded-full bg-[#cb7a45]/16 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,250,244,0.84))] p-6 shadow-[0_28px_80px_rgba(94,63,44,0.18)] backdrop-blur xl:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.24em] text-slate-500"
                    style={{
                      fontFamily:
                        "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                    }}
                  >
                    secure registration
                  </p>
                  <h2
                    className="mt-4 text-4xl leading-none text-slate-950"
                    style={{
                      fontFamily:
                        "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif",
                    }}
                  >
                    Создать аккаунт
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                    Создайте аккаунт администратора и изолированный тенант
                    вашей компании. После регистрации откроется диспетчерское
                    рабочее поле.
                  </p>
                </div>

                <div className="hidden rounded-[1.6rem] border border-slate-950/10 bg-slate-950 px-4 py-3 text-[#f3ebde] sm:block">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              {registerMutation.isError ? (
                <div className="mt-8 rounded-[1.6rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-red-400">
                    <span>ошибка регистрации</span>
                  </div>
                  <p className="mt-2 leading-6">
                    {extractApiErrorMessage(registerMutation.error)}
                  </p>
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
                noValidate
              >
                {/* firstName + lastName row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                      style={{
                        fontFamily:
                          "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                      }}
                    >
                      Имя
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Алексей"
                      autoComplete="given-name"
                      aria-invalid={errors.firstName ? 'true' : 'false'}
                      className="h-12 rounded-2xl border-slate-300/80 bg-white/80 text-sm shadow-sm focus-visible:ring-[#cb7a45]"
                      {...register('firstName')}
                    />
                    {errors.firstName ? (
                      <p className="text-sm text-destructive">
                        {errors.firstName.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                      style={{
                        fontFamily:
                          "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                      }}
                    >
                      Фамилия
                      <span className="ml-1 normal-case tracking-normal text-slate-400">
                        (необязательно)
                      </span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Иванов"
                      autoComplete="family-name"
                      className="h-12 rounded-2xl border-slate-300/80 bg-white/80 text-sm shadow-sm focus-visible:ring-[#cb7a45]"
                      {...register('lastName')}
                    />
                  </div>
                </div>

                {/* companyName */}
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                    style={{
                      fontFamily:
                        "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                    }}
                  >
                    Название компании
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ООО Экспресс Доставка"
                    autoComplete="organization"
                    aria-invalid={errors.companyName ? 'true' : 'false'}
                    className="h-12 rounded-2xl border-slate-300/80 bg-white/80 text-sm shadow-sm focus-visible:ring-[#cb7a45]"
                    {...register('companyName')}
                  />
                  {errors.companyName ? (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Название используется как идентификатор тенанта в
                      системе.
                    </p>
                  )}
                </div>

                {/* email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                    style={{
                      fontFamily:
                        "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                    }}
                  >
                    Рабочий email
                  </Label>
                  <div className="relative">
                    <MailLine />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      autoComplete="email"
                      aria-invalid={errors.email ? 'true' : 'false'}
                      className="h-12 rounded-2xl border-slate-300/80 bg-white/80 pl-12 text-sm shadow-sm focus-visible:ring-[#cb7a45]"
                      {...register('email')}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Будет использован для входа и уведомлений.
                    </p>
                  )}
                </div>

                {/* password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                    style={{
                      fontFamily:
                        "'IBM Plex Mono', 'SFMono-Regular', 'Consolas', monospace",
                    }}
                  >
                    Пароль
                  </Label>
                  <div className="relative">
                    <LockLine />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      aria-invalid={errors.password ? 'true' : 'false'}
                      className="h-12 rounded-2xl border-slate-300/80 bg-white/80 pl-12 pr-14 text-sm shadow-sm focus-visible:ring-[#cb7a45]"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-500 transition-colors hover:text-slate-950"
                      aria-label={
                        showPassword ? 'Скрыть пароль' : 'Показать пароль'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Минимум 8 символов.
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={registerMutation.isPending}
                    className="h-12 w-full rounded-full bg-slate-950 text-[#f3ebde] hover:bg-slate-800"
                  >
                    {registerMutation.isPending ? 'Создаём аккаунт...' : 'Создать аккаунт'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5 text-sm text-slate-500">
                <span>Уже есть аккаунт?</span>
                <Link
                  to={ROUTES.LOGIN}
                  className="font-medium text-slate-700 underline underline-offset-2 transition-colors hover:text-slate-950"
                >
                  Войти
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RegisterScreen

function MailLine(): React.ReactElement {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M4 6.75h16v10.5H4z" />
        <path d="m4 8 8 6 8-6" />
      </svg>
    </div>
  )
}

function LockLine(): React.ReactElement {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7.75a4 4 0 1 1 8 0V10" />
      </svg>
    </div>
  )
}
