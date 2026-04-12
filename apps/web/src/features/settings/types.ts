export interface CompanySettings {
  name: string
  slug: string
}

export interface OperationsSettings {
  timezone: string
}

export interface SlaSettings {
  atRiskWindowMinutes: number
}

export interface UpdateCompanySettingsInput {
  name?: string
}

export interface UpdateOperationsSettingsInput {
  timezone?: string
}

export interface UpdateSlaSettingsInput {
  atRiskWindowMinutes?: number
}
