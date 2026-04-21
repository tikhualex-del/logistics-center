import { CompanyStatus } from './company.types';

export const COMPANY_STATUSES: CompanyStatus[] = [
  'active',
  'inactive',
  'suspended',
  'trial',
  'pending_setup',
  'archived',
];

export const DEFAULT_COMPANY_STATUS: CompanyStatus = 'pending_setup';
