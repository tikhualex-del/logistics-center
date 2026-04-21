import { apiClient } from '@/lib/api/client'
import type { Company, CreateCompanyInput, PlatformAdmin, CreatePlatformAdminInput, ImpersonateInput } from './types'

export const platformApi = {
  listCompanies: (): Promise<Company[]> =>
    apiClient.get('/platform/companies'),

  getCompany: (id: string): Promise<Company> =>
    apiClient.get(`/platform/companies/${id}`),

  createCompany: (input: CreateCompanyInput): Promise<Company> =>
    apiClient.post('/platform/companies', input),

  listAdmins: (): Promise<PlatformAdmin[]> =>
    apiClient.get('/platform/admins'),

  getAdmin: (id: string): Promise<PlatformAdmin> =>
    apiClient.get(`/platform/admins/${id}`),

  createAdmin: (input: CreatePlatformAdminInput): Promise<PlatformAdmin> =>
    apiClient.post('/platform/admins', input),

  impersonate: (input: ImpersonateInput): Promise<{ token: string }> =>
    apiClient.post('/platform/impersonate', input),
}
