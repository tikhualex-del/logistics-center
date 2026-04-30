import { CompanyStatus } from '@prisma/client';

export interface ProvisionTenantOwnerInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface ProvisionTenantInput {
  name: string;
  slug: string;
  status?: CompanyStatus;
  timezone?: string;
  defaultCurrency?: string;
  language?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  planId?: string;
  owner: ProvisionTenantOwnerInput;
}
