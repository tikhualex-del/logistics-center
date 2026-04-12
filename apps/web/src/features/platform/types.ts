export type CompanyStatus = 'active' | 'suspended' | 'trial'

export interface Company {
  id: string
  name: string
  slug: string
  status: CompanyStatus
  plan?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyInput {
  name: string
  slug: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

export interface PlatformAdmin {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface CreatePlatformAdminInput {
  name: string
  email: string
  password: string
}

export interface ImpersonateInput {
  companyId: string
}
