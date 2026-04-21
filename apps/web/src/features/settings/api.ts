import { apiClient } from '@/lib/api/client'
import type {
  CompanySettings,
  OperationsSettings,
  SlaSettings,
  UpdateCompanySettingsInput,
  UpdateOperationsSettingsInput,
  UpdateSlaSettingsInput,
} from './types'

export const settingsApi = {
  getCompany: (): Promise<CompanySettings> =>
    apiClient.get('/settings/company'),

  updateCompany: (input: UpdateCompanySettingsInput): Promise<CompanySettings> =>
    apiClient.patch('/settings/company', input),

  getOperations: (): Promise<OperationsSettings> =>
    apiClient.get('/settings/operations'),

  updateOperations: (input: UpdateOperationsSettingsInput): Promise<OperationsSettings> =>
    apiClient.patch('/settings/operations', input),

  getSla: (): Promise<SlaSettings> =>
    apiClient.get('/settings/sla'),

  updateSla: (input: UpdateSlaSettingsInput): Promise<SlaSettings> =>
    apiClient.patch('/settings/sla', input),
}
