import httpClient from './http-client'
import type { ApiResponse } from './http-client'

export interface Company {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyDto {
  name?: string
}

export interface CompanyFeature {
  id: string
  companyId: string
  featureKey: string
  enabled: boolean
  config: Record<string, unknown> | null
  updatedByUserId: string | null
  enabledAt: string | null
  disabledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyFeatureDto {
  enabled: boolean
  config?: Record<string, unknown>
}

export async function getCurrentCompany(): Promise<Company> {
  const response = await httpClient.get<ApiResponse<Company>>('/companies/me')
  return response.data.data
}

export async function updateCurrentCompany(
  data: UpdateCompanyDto,
): Promise<Company> {
  const response = await httpClient.patch<ApiResponse<Company>>(
    '/companies/me',
    data,
  )
  return response.data.data
}

export async function getCompanyFeatures(): Promise<CompanyFeature[]> {
  const response = await httpClient.get<ApiResponse<CompanyFeature[]>>(
    '/companies/me/features',
  )
  return response.data.data
}

export async function updateCompanyFeature(
  featureKey: string,
  data: UpdateCompanyFeatureDto,
): Promise<CompanyFeature> {
  const response = await httpClient.patch<ApiResponse<CompanyFeature>>(
    `/companies/me/features/${featureKey}`,
    data,
  )
  return response.data.data
}
