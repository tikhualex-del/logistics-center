import { useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
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
import { CompanySettings } from './company-settings'

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; help: string }> = [
  {
    value: 'admin',
    label: 'Admin',
    help: 'Full company settings, users and finance access.',
  },
  {
    value: 'dispatcher',
    label: 'Dispatcher',
    help: 'Orders, routes, courier operations and dispatch board.',
  },
  {
    value: 'courier',
    label: 'Courier',
    help: 'Own orders and earnings access.',
  },
]

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
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              User management
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusPill label="Total" value={stats.total} />
            <StatusPill label="Active" value={stats.active} />
            <StatusPill label="Admins" value={stats.admins} />
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              <Plus />
              New user
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
                    Company users
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Role, contact information and account activity for this tenant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void usersQuery.refetch()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
                  aria-label="Refresh users"
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
                    placeholder="Search by name, email or phone"
                    className="pl-9"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
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
                  <option value="">All states</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
          Users could not be loaded.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <UserRound className="h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          No users match the filters.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Created users will appear here with role and activity state.
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
        <span>User</span>
        <span>Role</span>
        <span>Status</span>
        <span>Last login</span>
        <span>Created</span>
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
              {isEditing ? 'Edit user' : 'Create user'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage profile, role and activation state.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <Plus />
            New
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!canManageUsers && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700">
            Your current role cannot manage users.
          </p>
        )}

        <FormField label="Email" htmlFor="user-email" icon={<Mail />}>
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
          <FormField label="First name" htmlFor="first-name" icon={<UserRound />}>
            <Input
              id="first-name"
              value={form.firstName}
              onChange={(event) => onChange('firstName', event.target.value)}
              required
              disabled={!canManageUsers}
            />
          </FormField>
          <FormField label="Last name" htmlFor="last-name" icon={<UserRound />}>
            <Input
              id="last-name"
              value={form.lastName}
              onChange={(event) => onChange('lastName', event.target.value)}
              disabled={!canManageUsers}
            />
          </FormField>
        </div>

        <FormField label="Phone" htmlFor="user-phone" icon={<Phone />}>
          <Input
            id="user-phone"
            value={form.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            disabled={!canManageUsers}
            placeholder="+79990000000"
          />
        </FormField>

        <FormField
          label={isEditing ? 'New password' : 'Password'}
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
            placeholder={isEditing ? 'Leave empty to keep current password' : ''}
          />
        </FormField>

        <FormField label="Role" htmlFor="user-role" icon={<Shield />}>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => onChange('role', event.target.value as UserRole)}
            disabled={!canManageUsers}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </FormField>

        <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <span className="text-sm font-medium text-foreground">Active user</span>
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
          {isSaving ? 'Saving' : isEditing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}

function RoleGuide(): ReactElement {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Role guide</h2>
      <div className="mt-4 space-y-3">
        {ROLE_OPTIONS.map((role) => (
          <div key={role.value} className="rounded-lg border border-border bg-background p-3">
            <RoleBadge role={role.value} />
            <p className="mt-2 text-sm text-muted-foreground">{role.help}</p>
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
  const label = ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        ROLE_STYLES[role],
      )}
    >
      {label}
    </span>
  )
}

function ActivityBadge({ isActive }: { isActive: boolean }): ReactElement {
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
      {isActive ? 'Active' : 'Inactive'}
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
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
