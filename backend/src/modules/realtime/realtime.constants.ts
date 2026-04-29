import { UserRole } from '@prisma/client';

export const REALTIME_NAMESPACE = '/realtime';

export function getCompanyRoom(companyId: string): string {
  return `company:${companyId}`;
}

export function getCompanyRoleRoom(companyId: string, role: UserRole): string {
  return `company:${companyId}:role:${role}`;
}

export function getCompanyUserRoom(companyId: string, userId: string): string {
  return `company:${companyId}:user:${userId}`;
}
