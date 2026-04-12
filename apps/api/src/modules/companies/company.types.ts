export type CompanyStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'trial'
  | 'pending_setup'
  | 'archived';

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  timezone: string;
  defaultCurrency: string;
  language: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  slug: string;
  timezone: string;
  defaultCurrency: string;
  language: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  planId: string;
}

export interface UpdateCompanyInput {
  name?: string;
  timezone?: string;
  defaultCurrency?: string;
  language?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  planId?: string;
}

export interface ChangeCompanyStatusInput {
  status: CompanyStatus;
}
