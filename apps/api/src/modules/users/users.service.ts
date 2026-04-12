import bcrypt from 'bcryptjs';
import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateUserInput, UpdateUserInput, ChangeRoleInput, UserResponse } from './users.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUserResponse(
  user: { id: string; email: string; fullName: string; status: string; createdAt: Date },
  roleName: string | null,
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    role: roleName,
    createdAt: user.createdAt,
  };
}

// Returns the name of the user's sole active role link, or null for broken data.
function extractRole(
  roleLinks: Array<{ status: string; role: { name: string } }>,
): string | null {
  const active = roleLinks.filter((l) => l.status === 'active');
  if (active.length === 1) return active[0].role.name;
  // Defensive: 0 active links = data integrity issue; >1 = same
  return null;
}

// Returns true if there are no other active owner role links besides the given userId.
async function isLastActiveOwner(
  tenantPrisma: ReturnType<typeof getTenantPrisma>,
  userId: string,
): Promise<boolean> {
  const count = await tenantPrisma.userRoleLink.count({
    where: {
      status: 'active',
      role: { name: 'owner' },
      userId: { not: userId },
    },
  });
  return count === 0;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function listUsers(companyId: string): Promise<UserResponse[]> {
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

  return users.map((u) => toUserResponse(u, extractRole(u.roleLinks)));
}

export async function getUser(companyId: string, userId: string): Promise<UserResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const user = await tenantPrisma.user.findUnique({
    where: { id: userId },
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
  });

  if (!user) throw new AppError(404, 'User not found');

  return toUserResponse(user, extractRole(user.roleLinks));
}

export async function createUser(
  companyId: string,
  input: CreateUserInput,
): Promise<UserResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  // Check email uniqueness before starting the transaction.
  const existing = await tenantPrisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'A user with this email already exists');

  // Resolve the role — must exist (seeded at provisioning).
  const role = await tenantPrisma.role.findUnique({ where: { name: input.role } });
  if (!role) throw new AppError(400, `Role '${input.role}' does not exist`);

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await tenantPrisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        companyId,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        status: 'invited',
      },
    });

    await tx.userRoleLink.create({
      data: {
        userId: created.id,
        roleId: role.id,
        status: 'active',
      },
    });

    return created;
  });

  return toUserResponse(user, input.role);
}

export async function updateUser(
  companyId: string,
  userId: string,
  input: UpdateUserInput,
  callerUserId: string,
): Promise<UserResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const user = await tenantPrisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      roleLinks: { select: { status: true, role: { select: { name: true } } } },
    },
  });
  if (!user) throw new AppError(404, 'User not found');

  if (input.status && input.status !== 'active') {
    // Caller cannot suspend or remove themselves.
    if (userId === callerUserId) {
      throw new AppError(400, 'You cannot change your own status');
    }

    // Cannot suspend/remove the last active owner.
    const currentRole = extractRole(user.roleLinks);
    if (currentRole === 'owner' && (await isLastActiveOwner(tenantPrisma, userId))) {
      throw new AppError(400, 'Cannot change status of the last active owner');
    }
  }

  const updated = await tenantPrisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.status !== undefined && { status: input.status }),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      roleLinks: { select: { status: true, role: { select: { name: true } } } },
    },
  });

  return toUserResponse(updated, extractRole(updated.roleLinks));
}

export async function changeRole(
  companyId: string,
  userId: string,
  input: ChangeRoleInput,
  callerUserId: string,
): Promise<UserResponse> {
  const tenantPrisma = getTenantPrisma(companyId);

  const user = await tenantPrisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      roleLinks: { select: { id: true, status: true, role: { select: { name: true } } } },
    },
  });
  if (!user) throw new AppError(404, 'User not found');

  const currentRole = extractRole(user.roleLinks);

  // Protect the last active owner from being demoted.
  if (currentRole === 'owner' && input.role !== 'owner') {
    if (await isLastActiveOwner(tenantPrisma, userId)) {
      throw new AppError(400, 'Cannot change role of the last active owner');
    }
  }

  // Resolve the target role.
  const newRole = await tenantPrisma.role.findUnique({ where: { name: input.role } });
  if (!newRole) throw new AppError(400, `Role '${input.role}' does not exist`);

  // Deactivate existing active link + create new link in one transaction.
  await tenantPrisma.$transaction(async (tx) => {
    // Deactivate all active links for this user (should be exactly one, but handle >1 defensively).
    await tx.userRoleLink.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'removed' },
    });

    // Use upsert: the @@unique([userId, roleId]) constraint means a prior
    // link for this role may already exist (e.g. previously removed). Reactivate it.
    await tx.userRoleLink.upsert({
      where: { userId_roleId: { userId, roleId: newRole.id } },
      update: { status: 'active' },
      create: { userId, roleId: newRole.id, status: 'active' },
    });
  });

  return toUserResponse(user, input.role);
}
