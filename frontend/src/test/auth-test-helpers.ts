import { useAuthStore } from '@/store/auth.store'
import type { AuthUser } from '@/store/auth.store'

export const authUser: AuthUser = {
  id: 'user-1',
  companyId: 'company-1',
  email: 'dispatcher@example.com',
  role: 'dispatcher',
  firstName: 'Dina',
  lastName: 'Dispatcher',
}

export function resetAuthState(): void {
  localStorage.clear()
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  })
}

