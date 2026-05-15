import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/store/auth.store'
import type { AuthUser, UserRole } from '@/store/auth.store'
import { usePermissions } from './use-permissions'
import type { Permission } from './use-permissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(role: UserRole): AuthUser {
  return {
    id: `user-${role}`,
    companyId: 'company-1',
    email: `${role}@example.com`,
    role,
    firstName: role.charAt(0).toUpperCase() + role.slice(1),
    lastName: 'Test',
  }
}

function setUser(user: AuthUser | null): void {
  useAuthStore.setState({ user, accessToken: null, isAuthenticated: user !== null })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  setUser(null)
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Group 1: Unauthenticated
// ---------------------------------------------------------------------------

describe('usePermissions — unauthenticated (user = null)', () => {
  it('returns role = null when no user is set', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBeNull()
  })

  it('denies view:orders when not authenticated', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:orders')).toBe(false)
  })

  it('denies every permission when not authenticated', () => {
    const { result } = renderHook(() => usePermissions())
    const permissions: Permission[] = [
      'view:orders',
      'create:orders',
      'edit:orders',
      'build:routes',
      'edit:routes',
      'edit:zones',
      'edit:payment-rules',
      'approve:motivation-rules',
      'view:financial-analytics',
      'view:operational-analytics',
      'view:own-earnings',
      'manage:couriers',
      'manage:shifts',
      'connect:integrations',
      'manage:users',
    ]
    for (const perm of permissions) {
      expect(result.current.can(perm), `should deny ${perm}`).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Group 2: Admin role
// ---------------------------------------------------------------------------

describe('usePermissions — admin', () => {
  beforeEach(() => setUser(makeUser('admin')))

  it('returns role = admin', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBe('admin')
  })

  it('grants view:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:orders')).toBe(true)
  })

  it('grants edit:payment-rules (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('edit:payment-rules')).toBe(true)
  })

  it('grants approve:motivation-rules (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('approve:motivation-rules')).toBe(true)
  })

  it('grants manage:users (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('manage:users')).toBe(true)
  })

  it('grants view:financial-analytics (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:financial-analytics')).toBe(true)
  })

  it('grants connect:integrations (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('connect:integrations')).toBe(true)
  })

  it('grants all 15 permissions', () => {
    const { result } = renderHook(() => usePermissions())
    const adminPermissions: Permission[] = [
      'view:orders',
      'create:orders',
      'edit:orders',
      'build:routes',
      'edit:routes',
      'edit:zones',
      'edit:payment-rules',
      'approve:motivation-rules',
      'view:financial-analytics',
      'view:operational-analytics',
      'view:own-earnings',
      'manage:couriers',
      'manage:shifts',
      'connect:integrations',
      'manage:users',
    ]
    for (const perm of adminPermissions) {
      expect(result.current.can(perm), `admin should have ${perm}`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Group 3: Dispatcher role
// ---------------------------------------------------------------------------

describe('usePermissions — dispatcher', () => {
  beforeEach(() => setUser(makeUser('dispatcher')))

  it('returns role = dispatcher', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBe('dispatcher')
  })

  it('grants view:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:orders')).toBe(true)
  })

  it('grants build:routes', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('build:routes')).toBe(true)
  })

  it('grants manage:couriers', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('manage:couriers')).toBe(true)
  })

  it('grants create:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('create:orders')).toBe(true)
  })

  it('grants edit:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('edit:orders')).toBe(true)
  })

  it('grants view:operational-analytics', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:operational-analytics')).toBe(true)
  })

  it('denies edit:payment-rules (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('edit:payment-rules')).toBe(false)
  })

  it('denies manage:users (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('manage:users')).toBe(false)
  })

  it('denies view:financial-analytics (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:financial-analytics')).toBe(false)
  })

  it('denies view:own-earnings (courier-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:own-earnings')).toBe(false)
  })

  it('denies connect:integrations (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('connect:integrations')).toBe(false)
  })

  it('denies approve:motivation-rules (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('approve:motivation-rules')).toBe(false)
  })

  it('denies edit:zones (admin-only)', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('edit:zones')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group 4: Courier role
// ---------------------------------------------------------------------------

describe('usePermissions — courier', () => {
  beforeEach(() => setUser(makeUser('courier')))

  it('returns role = courier', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBe('courier')
  })

  it('grants view:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:orders')).toBe(true)
  })

  it('grants view:own-earnings', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:own-earnings')).toBe(true)
  })

  it('denies build:routes', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('build:routes')).toBe(false)
  })

  it('denies edit:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('edit:orders')).toBe(false)
  })

  it('denies manage:couriers', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('manage:couriers')).toBe(false)
  })

  it('denies create:orders', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('create:orders')).toBe(false)
  })

  it('has exactly 2 permissions (no extras)', () => {
    const { result } = renderHook(() => usePermissions())
    const allPerms: Permission[] = [
      'view:orders',
      'create:orders',
      'edit:orders',
      'build:routes',
      'edit:routes',
      'edit:zones',
      'edit:payment-rules',
      'approve:motivation-rules',
      'view:financial-analytics',
      'view:operational-analytics',
      'view:own-earnings',
      'manage:couriers',
      'manage:shifts',
      'connect:integrations',
      'manage:users',
    ]
    const granted = allPerms.filter((p) => result.current.can(p))
    expect(granted).toHaveLength(2)
    expect(granted).toEqual(expect.arrayContaining(['view:orders', 'view:own-earnings']))
  })
})

// ---------------------------------------------------------------------------
// Group 5: Edge cases
// ---------------------------------------------------------------------------

describe('usePermissions — edge cases', () => {
  it('returns false for all permissions when role is unknown', () => {
    const userWithUnknownRole = {
      ...makeUser('admin'),
      role: 'superadmin' as unknown as UserRole,
    }
    setUser(userWithUnknownRole)
    const { result } = renderHook(() => usePermissions())
    expect(result.current.can('view:orders')).toBe(false)
    expect(result.current.can('manage:users')).toBe(false)
  })

  it('reflects unknown role value in role field', () => {
    const userWithUnknownRole = {
      ...makeUser('admin'),
      role: 'superadmin' as unknown as UserRole,
    }
    setUser(userWithUnknownRole)
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBe('superadmin')
  })

  it('reflects updated role immediately when user switches mid-session', () => {
    setUser(makeUser('courier'))
    const { result } = renderHook(() => usePermissions())

    expect(result.current.role).toBe('courier')
    expect(result.current.can('manage:users')).toBe(false)

    act(() => {
      setUser(makeUser('admin'))
    })

    expect(result.current.role).toBe('admin')
    expect(result.current.can('manage:users')).toBe(true)
  })

  it('reflects logout (user set to null) immediately', () => {
    setUser(makeUser('admin'))
    const { result } = renderHook(() => usePermissions())

    expect(result.current.role).toBe('admin')

    act(() => {
      setUser(null)
    })

    expect(result.current.role).toBeNull()
    expect(result.current.can('view:orders')).toBe(false)
  })
})
