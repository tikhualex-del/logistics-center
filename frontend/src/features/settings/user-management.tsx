import { useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react'
import type { CreateUserDto, UpdateUserDto, User } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateUser, usePermissions, useUpdateUser, useUsers } from '@/hooks'
import type { UserRole } from '@/store'
import { cn } from '@/lib/utils'
import i18n from '@/i18n'
import { CompanySettings } from './company-settings'

const ROLE_VALUES: UserRole[] = ['admin', 'dispatcher', 'courier']

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
  dispatcher: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  courier: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
}

interface UserFormState {
  id: string | null
  email: string
  password: string
  phone: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
}

const DEFAULT_FORM: UserFormState = {
  id: null,
  email: '',
  password: '',
  phone: '',
  firstName: '',
  lastName: '',
  role: 'dispatcher',
  isActive: true,
}

export function UserManagement(): ReactElement {
  const { t } = useTranslation()
  const [form, setForm] = useState<UserFormState>(DEFAULT_FORM)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [activityFilter, setActivityFilter] = useState<'active' | 'inactive' | ''>(
    '',
  )

  const usersQuery = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const { can } = usePermissions()

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const visibleUsers = useMemo(
    () => filterUsers(users, search, roleFilter, activityFilter),
    [activityFilter, roleFilter, search, users],
  )
  const stats = useMemo(() => getUserStats(users), [users])
  const isSaving = createUserMutation.isPending || updateUserMutation.isPending
  const saveError = createUserMutation.error ?? updateUserMutation.error
  const canManageUsers = can('manage:users')

  function updateForm<Key extends keyof UserFormState>(
    key: Key,
    value: UserFormState[Key],
  ): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm(): void {
    setForm(DEFAULT_FORM)
    createUserMutation.reset()
    updateUserMutation.reset()
  }

  function editUser(user: User): void {
    setForm({
      id: user.id,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      role: user.role,
      isActive: user.isActive,
    })
    createUserMutation.reset()
    updateUserMutation.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (!canManageUsers) return

    if (form.id) {
      const payload = formToUpdatePayload(form)
      updateUserMutation.mutate(
        { id: form.id, data: payload },
        { onSuccess: resetForm },
      )
    } else {
      const payload = formToCreatePayload(form)
      createUserMutation.mutate(payload, { onSuccess: resetForm })
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('settings.section')}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {t('settings.users.title')}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusPill label={t('settings.users.stats.total')} value={stats.total} />
            <StatusPill label={t('settings.users.stats.active')} value={stats.active} />
            <StatusPill label={t('settings.users.stats.admins')} value={stats.admins} />
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              <Plus />
              {t('settings.users.newUser')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <CompanySettings />

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t('settings.users.list')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settings.users.listSubtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void usersQuery.refetch()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
                  aria-label={t('settings.users.refresh')}
                >
                  <RefreshCw
                    className={cn(
                      'h-4 w-4',
                      usersQuery.isFetching && 'animate-spin',
                    )}
                  />
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('settings.users.searchPlaceholder')}
                    className="pl-9"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t('settings.users.allRoles')}</option>
                  {ROLE_VALUES.map((role) => (
                    <option key={role} value={role}>
                      {t(`settings.users.roles.${role}.label`)}
                    </option>
                  ))}
                </select>
                <select
                  value={activityFilter}
                  onChange={(event) =>
                    setActivityFilter(event.target.value as 'active' | 'inactive' | '')
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t('settings.users.allStates')}</option>
                  <option value="active">{t('settings.users.statusActive')}</option>
                  <option value="inactive">{t('settings.users.statusInactive')}</option>
                </select>
              </div>
            </div>

            <UsersTable
              users={visibleUsers}
              isLoading={usersQuery.isLoading}
              isError={usersQuery.isError}
              selectedUserId={form.id}
              onRetry={() => void usersQuery.refetch()}
              onEdit={editUser}
            />
          </section>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <UserEditor
              form={form}
              canManageUsers={canManageUsers}
              isSaving={isSaving}
              saveError={saveError}
              onChange={updateForm}
              onReset={resetForm}
              onSubmit={handleSubmit}
            />
            <RoleGuide />
          </aside>
        </div>
      </main>
    </div>
  )
}

function UsersTable({
  users,
  isLoading,
  isError,
  selectedUserId,
  onRetry,
  onEdit,
}: {
  users: User[]
  isLoading: boolean
  isError: boolean
  selectedUserId: string | null
  onRetry: () => void
  onEdit: (user: User) => void
}): ReactElement {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <UserRound className="h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t('settings.users.loadError')}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <UserRound className="h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t('settings.users.emptyFilters')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.users.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="hidden min-w-[900px] grid-cols-[minmax(240px,1.3fr)_150px_140px_minmax(190px,0.9fr)_140px_56px] gap-4 border-b border-border bg-muted/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid"
        role="row"
      >
        <span>{t('settings.users.columns.user')}</span>
        <span>{t('settings.users.columns.role')}</span>
        <span>{t('settings.users.columns.status')}</span>
        <span>{t('settings.users.columns.lastLogin')}</span>
        <span>{t('settings.users.columns.created')}</span>
        <span />
      </div>
      <div className="min-w-0 divide-y divide-border md:min-w-[900px]">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onEdit(user)}
            className={cn(
              'grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-accent',
              'md:grid-cols-[minmax(240px,1.3fr)_150px_140px_minmax(190px,0.9fr)_140px_56px] md:items-center md:gap-4',
              selectedUserId === user.id &&
                'bg-primary/5 ring-1 ring-inset ring-primary/20',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {getInitials(user)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {formatUserName(user)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {user.email}
                  {user.phone ? ` - ${user.phone}` : ''}
                </span>
              </span>
            </div>
            <RoleBadge role={user.role} />
            <ActivityBadge isActive={user.isActive} />
            <p className="text-sm text-muted-foreground">
              {formatDateTime(user.lastLoginAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(user.createdAt)}
            </p>
            <Edit3 className="h-4 w-4 text-muted-foreground md:justify-self-end" />
          </button>
        ))}
      </div>
    </div>
  )
}

function UserEditor({
  form,
  canManageUsers,
  isSaving,
  saveError,
  onChange,
  onReset,
  onSubmit,
}: {
  form: UserFormState
  canManageUsers: boolean
  isSaving: boolean
  saveError: Error | null
  onChange: <Key extends keyof UserFormState>(
    key: Key,
    value: UserFormState[Key],
  ) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}): ReactElement {
  const { t } = useTranslation()
  const isEditing = form.id !== null

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isEditing
                ? t('settings.users.form.editUser')
                : t('settings.users.form.createUser')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.users.form.manageHint')}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <Plus />
            {t('settings.integrations.new')}
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!canManageUsers && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700">
            {t('settings.users.form.cannotManage')}
          </p>
        )}

        <FormField label={t('settings.users.form.email')} htmlFor="user-email" icon={<Mail />}>
          <Input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(event) => onChange('email', event.target.value)}
            required
            disabled={!canManageUsers}
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label={t('settings.users.form.firstName')}
            htmlFor="first-name"
            icon={<UserRound />}
          >
            <Input
              id="first-name"
              value={form.firstName}
              onChange={(event) => onChange('firstName', event.target.value)}
              required
              disabled={!canManageUsers}
            />
          </FormField>
          <FormField
            label={t('settings.users.form.lastName')}
            htmlFor="last-name"
            icon={<UserRound />}
          >
            <Input
              id="last-name"
              value={form.lastName}
              onChange={(event) => onChange('lastName', event.target.value)}
              disabled={!canManageUsers}
            />
          </FormField>
        </div>

        <FormField label={t('settings.users.form.phone')} htmlFor="user-phone" icon={<Phone />}>
          <Input
            id="user-phone"
            value={form.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            disabled={!canManageUsers}
            placeholder="+79990000000"
          />
        </FormField>

        <FormField
          label={
            isEditing
              ? t('settings.users.form.newPassword')
              : t('settings.users.form.password')
          }
          htmlFor="user-password"
          icon={<KeyRound />}
        >
          <Input
            id="user-password"
            type="password"
            value={form.password}
            onChange={(event) => onChange('password', event.target.value)}
            minLength={8}
            maxLength={72}
            required={!isEditing}
            disabled={!canManageUsers}
            placeholder={isEditing ? t('settings.users.form.keepPassword') : ''}
          />
        </FormField>

        <FormField label={t('settings.users.form.role')} htmlFor="user-role" icon={<Shield />}>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => onChange('role', event.target.value as UserRole)}
            disabled={!canManageUsers}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ROLE_VALUES.map((role) => (
              <option key={role} value={role}>
                {t(`settings.users.roles.${role}.label`)}
              </option>
            ))}
          </select>
        </FormField>

        <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <span className="text-sm font-medium text-foreground">
            {t('settings.users.form.activeUser')}
          </span>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => onChange('isActive', event.target.checked)}
            disabled={!canManageUsers}
            className="h-4 w-4 accent-primary disabled:cursor-not-allowed"
          />
        </label>

        {saveError !== null && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {saveError.message}
          </p>
        )}

        <Button type="submit" disabled={!canManageUsers || isSaving} className="w-full">
          {isEditing ? <Edit3 /> : <Plus />}
          {isSaving
            ? t('common.saving')
            : isEditing
              ? t('settings.users.form.saveChanges')
              : t('settings.users.form.createUser')}
        </Button>
      </div>
    </form>
  )
}

function RoleGuide(): ReactElement {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">
        {t('settings.users.roleGuide')}
      </h2>
      <div className="mt-4 space-y-3">
        {ROLE_VALUES.map((role) => (
          <div key={role} className="rounded-lg border border-border bg-background p-3">
            <RoleBadge role={role} />
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`settings.users.roles.${role}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FormField({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string
  htmlFor: string
  icon: React.ReactNode
  children: React.ReactNode
}): ReactElement {
  return (
    <div>
      <Label htmlFor={htmlFor} className="flex items-center gap-2">
        <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
          {icon}
        </span>
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }): ReactElement {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        ROLE_STYLES[role],
      )}
    >
      {t(`settings.users.roles.${role}.label`)}
    </span>
  )
}

function ActivityBadge({ isActive }: { isActive: boolean }): ReactElement {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20',
      )}
    >
      {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {isActive ? t('settings.users.statusActive') : t('settings.users.statusInactive')}
    </span>
  )
}

function StatusPill({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
      <span>{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  )
}

function filterUsers(
  users: User[],
  search: string,
  role: UserRole | '',
  activity: 'active' | 'inactive' | '',
): User[] {
  const normalizedSearch = search.trim().toLowerCase()

  return users.filter((user) => {
    if (role && user.role !== role) return false
    if (activity === 'active' && !user.isActive) return false
    if (activity === 'inactive' && user.isActive) return false
    if (!normalizedSearch) return true

    return [
      formatUserName(user),
      user.email,
      user.phone ?? '',
      user.role,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  })
}

function getUserStats(users: User[]): {
  total: number
  active: number
  admins: number
} {
  return {
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    admins: users.filter((user) => user.role === 'admin').length,
  }
}

function formToCreatePayload(form: UserFormState): CreateUserDto {
  return {
    email: form.email.trim(),
    password: form.password,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim() || undefined,
    phone: form.phone.trim() || undefined,
    role: form.role,
  }
}

function formToUpdatePayload(form: UserFormState): UpdateUserDto {
  return {
    email: form.email.trim(),
    ...(form.password ? { password: form.password } : {}),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim() || undefined,
    phone: form.phone.trim() || undefined,
    role: form.role,
    isActive: form.isActive,
  }
}

function formatUserName(user: User): string {
  const name = `${user.firstName} ${user.lastName ?? ''}`.trim()
  return name || user.email
}

function getInitials(user: User): string {
  const first = user.firstName.trim().charAt(0)
  const last = user.lastName?.trim().charAt(0) ?? ''
  const initials = `${first}${last}`.trim()

  return initials ? initials.toUpperCase() : user.email.slice(0, 2).toUpperCase()
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.t('common.unknown')

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null): string {
  if (!value) return i18n.t('common.never')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.t('common.unknown')

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
