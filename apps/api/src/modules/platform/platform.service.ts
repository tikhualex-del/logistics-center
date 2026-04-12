import bcrypt from 'bcryptjs';
import { systemPrisma } from '../../lib/prisma-system';
import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import type {
  SeedOwnerInput,
  SeedOwnerResponse,
  TenantUserView,
  CreateAdminInput,
  UpdateAdminInput,
  AdminResponse,
} from './platform.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAdminResponse(row: {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): AdminResponse {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function extractRole(
  roleLinks: Array<{ status: string; role: { name: string } }>,
): string | null {
  const active = roleLinks.filter((l) => l.status === 'active');
  if (active.length === 1) return active[0].role.name;
  return null;
}

// ─── Company / tenant operations ──────────────────────────────────────────────

// Bootstrap-only: creates the first owner in an empty tenant.
// All three steps run inside a single tenant transaction.
// Any existing active role link causes a 409 — the company is already initialized.
export async function seedOwner(
  companyId: string,
  input: SeedOwnerInput,
): Promise<SeedOwnerResponse> {
  // Verify company exists in system schema.
  const company = await systemPrisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) throw new AppError(404, 'Company not found');

  const tenantPrisma = getTenantPrisma(companyId);

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await tenantPrisma.$transaction(async (tx) => {
    // Eligibility check inside the transaction — any active role link means
    // the company is already initialized; bootstrap is locked.
    const activeLinks = await tx.userRoleLink.count({ where: { status: 'active' } });
    if (activeLinks > 0) {
      throw new AppError(409, 'Company is already initialized — seed-owner is a bootstrap-only endpoint');
    }

    // Email uniqueness check inside the transaction.
    const existing = await tx.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'A user with this email already exists');

    // Resolve the owner role — seeded at provisioning, must always exist.
    const ownerRole = await tx.role.findUnique({ where: { name: 'owner' } });
    if (!ownerRole) throw new AppError(500, 'Owner role not found — tenant may not be provisioned');

    const created = await tx.user.create({
      data: {
        companyId,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        // Super admin is directly activating this user — not 'invited'.
        status: 'active',
      },
    });

    await tx.userRoleLink.create({
      data: {
        userId: created.id,
        roleId: ownerRole.id,
        status: 'active',
      },
    });

    return created;
  });

  // Audit event written after transaction commits.
  // If this fails, the seed is already committed — audit loss is observable but accepted.
  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      action: 'seed_owner',
      targetType: 'company',
      targetId: companyId,
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    role: 'owner',
    createdAt: user.createdAt,
  };
}

// Read-only support/admin visibility of tenant users.
// Not a user management path — no writes, no mutations.
export async function listTenantUsers(companyId: string): Promise<TenantUserView[]> {
  const company = await systemPrisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) throw new AppError(404, 'Company not found');

  const tenantPrisma = getTenantPrisma(companyId);

  const users = await tenantPrisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      roleLinks: {
        select: { status: true, role: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    status: u.status,
    role: extractRole(u.roleLinks),
    createdAt: u.createdAt,
  }));
}

// ─── Super admin management ───────────────────────────────────────────────────

export async function listAdmins(): Promise<AdminResponse[]> {
  const rows = await systemPrisma.platformSuperAdmin.findMany({
    select: { id: true, email: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toAdminResponse);
}

export async function createAdmin(input: CreateAdminInput): Promise<AdminResponse> {
  const existing = await systemPrisma.platformSuperAdmin.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new AppError(409, 'A super admin with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, 10);

  const row = await systemPrisma.platformSuperAdmin.create({
    data: { email: input.email, passwordHash, status: 'active' },
    select: { id: true, email: true, status: true, createdAt: true, updatedAt: true },
  });

  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      action: 'create_admin',
      targetType: 'platform_super_admin',
      targetId: row.id,
    },
  });

  return toAdminResponse(row);
}

export async function getAdmin(adminId: string): Promise<AdminResponse> {
  const row = await systemPrisma.platformSuperAdmin.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, status: true, createdAt: true, updatedAt: true },
  });
  if (!row) throw new AppError(404, 'Super admin not found');
  return toAdminResponse(row);
}

export async function updateAdmin(
  adminId: string,
  input: UpdateAdminInput,
  callerAdminId: string,
): Promise<AdminResponse> {
  const target = await systemPrisma.platformSuperAdmin.findUnique({
    where: { id: adminId },
    select: { id: true },
  });
  if (!target) throw new AppError(404, 'Super admin not found');

  if (input.status === 'suspended') {
    if (adminId === callerAdminId) {
      throw new AppError(400, 'You cannot suspend your own account');
    }

    // Ensure at least one other active super admin exists.
    const otherActive = await systemPrisma.platformSuperAdmin.count({
      where: { status: 'active', id: { not: adminId } },
    });
    if (otherActive === 0) {
      throw new AppError(400, 'Cannot suspend the last active super admin');
    }
  }

  const row = await systemPrisma.platformSuperAdmin.update({
    where: { id: adminId },
    data: { status: input.status },
    select: { id: true, email: true, status: true, createdAt: true, updatedAt: true },
  });

  await systemPrisma.platformAuditEvent.create({
    data: {
      actorType: 'super_admin',
      actorId: callerAdminId,
      action: 'update_admin_status',
      targetType: 'platform_super_admin',
      targetId: adminId,
      metadata: { status: input.status },
    },
  });

  return toAdminResponse(row);
}
