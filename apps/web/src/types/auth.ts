export interface LoginRequest {
  email: string
  password: string
  companySlug: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    fullName: string
    role: string
  }
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
}
