import { API_CONFIG } from './config'
import { ApiError } from './errors'

// ─── Storage accessors ────────────────────────────────────────────────────────
// Guards against SSR (localStorage unavailable on server)

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('lc_token')
}

function getCompanyId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('lc_company_id')
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const companyId = getCompanyId()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token     && { Authorization: `Bearer ${token}` }),
    ...(companyId && { 'x-company-id': companyId }),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(res.status, body.message ?? 'Request failed')
  }

  const json = await res.json()
  // Backend wraps responses in { success: true, data: ... }
  return (json.data ?? json) as T
}

// ─── HTTP methods ─────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}
