import type { CompanyStatus } from './types'

export function isCompanyActive(status: CompanyStatus): boolean {
  return status === 'active'
}
