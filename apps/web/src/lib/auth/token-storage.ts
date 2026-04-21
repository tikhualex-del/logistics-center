// Keys used in localStorage
const TOKEN_KEY      = 'lc_token'
const COMPANY_ID_KEY = 'lc_company_id'
const USER_KEY       = 'lc_user'

export interface StoredUser {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
}

function isBrowser() { return typeof window !== 'undefined' }

export const tokenStorage = {
  getToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getCompanyId(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(COMPANY_ID_KEY)
  },

  setCompanyId(id: string): void {
    localStorage.setItem(COMPANY_ID_KEY, id)
  },

  getUser(): StoredUser | null {
    if (!isBrowser()) return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  },

  setUser(user: StoredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(COMPANY_ID_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
