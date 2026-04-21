import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProtectedRoute } from '@/components/protected-route'
import { PublicRoute } from '@/components/public-route'
import { renderWithProviders } from '@/test/test-utils'
import { authUser, resetAuthState } from '@/test/auth-test-helpers'
import { useAuthStore } from '@/store/auth.store'

function TestRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <h1>Login page</h1>
          </PublicRoute>
        }
      />
      <Route path="/dispatcher" element={<h1>Dispatcher page</h1>} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <h1>Settings page</h1>
          </ProtectedRoute>
        }
      />
      <Route
        path="/couriers"
        element={
          <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
            <h1>Couriers page</h1>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

describe('auth route guards', () => {
  beforeEach(() => {
    resetAuthState()
  })

  it('redirects unauthenticated users from protected routes to login', () => {
    renderWithProviders(<TestRoutes />, {
      initialEntries: ['/couriers'],
    })

    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  })

  it('redirects authenticated users away from public auth pages', () => {
    useAuthStore.getState().setAuth(authUser, 'access-token-1')

    renderWithProviders(<TestRoutes />, {
      initialEntries: ['/login'],
    })

    expect(
      screen.getByRole('heading', { name: 'Dispatcher page' }),
    ).toBeInTheDocument()
  })

  it('redirects authenticated users without required role to dispatcher', () => {
    useAuthStore.getState().setAuth(authUser, 'access-token-1')

    renderWithProviders(<TestRoutes />, {
      initialEntries: ['/settings'],
    })

    expect(
      screen.getByRole('heading', { name: 'Dispatcher page' }),
    ).toBeInTheDocument()
  })
})

