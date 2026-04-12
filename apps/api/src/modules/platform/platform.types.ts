// Input/output shapes for the Platform module.

// ─── Seed owner ───────────────────────────────────────────────────────────────

export interface SeedOwnerInput {
  email: string;
  fullName: string;
  password: string;
}

export interface SeedOwnerResponse {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: 'owner';
  createdAt: Date;
}

// ─── Tenant user view (read-only support visibility) ─────────────────────────

export interface TenantUserView {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: string | null; // null = data integrity issue (defensive only)
  createdAt: Date;
}

// ─── Super admin management ───────────────────────────────────────────────────

export interface CreateAdminInput {
  email: string;
  password: string;
}

export interface UpdateAdminInput {
  status: string; // active | suspended
}

export interface AdminResponse {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
