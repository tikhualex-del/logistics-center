import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginApi } from '@/api/auth.api'
import { renderWithProviders } from '@/test/test-utils'
import { authUser, resetAuthState } from '@/test/auth-test-helpers'
import { useAuthStore } from '@/store/auth.store'
import { useLoginMutation } from './use-auth-mutations'

vi.mock('@/api/auth.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/auth.api')>()
  return {
    ...actual,
    loginApi: vi.fn(),
  }
})

function LoginMutationProbe() {
  const location = useLocation()
  const loginMutation = useLoginMutation()

  return (
    <>
      <button
        type="button"
        onClick={() =>
          loginMutation.mutate({
            email: 'dispatcher@example.com',
            password: 'SecurePass123!',
          })
        }
      >
        login
      </button>
      <span data-testid="path">{location.pathname}</span>
    </>
  )
}

describe('useLoginMutation', () => {
  beforeEach(() => {
    resetAuthState()
    vi.mocked(loginApi).mockReset()
  })

  it('persists authenticated user and redirects to dispatcher after login', async () => {
    vi.mocked(loginApi).mockResolvedValue({
      accessToken: 'access-token-1',
      user: authUser,
    })

    renderWithProviders(<LoginMutationProbe />, {
      initialEntries: ['/login'],
    })

    await userEvent.click(screen.getByRole('button', { name: 'login' }))

    expect(await screen.findByText('/dispatcher')).toBeInTheDocument()
    expect(localStorage.getItem('access_token')).toBe('access-token-1')
    expect(useAuthStore.getState()).toEqual(
      expect.objectContaining({
        accessToken: 'access-token-1',
        isAuthenticated: true,
        user: authUser,
      }),
    )
  })
})

