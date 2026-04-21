// Canonical statuses for User and CompanyMembership.
// Values match the recommendations in schema.prisma comments.

export const USER_STATUSES = [
  'active',     // can log in and use the platform
  'invited',    // invitation sent, not yet accepted
  'suspended',  // access revoked temporarily
  'removed',    // permanently deactivated
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  'active',     // full access within the company
  'invited',    // invited to the company, not yet accepted
  'suspended',  // company access revoked temporarily
  'removed',    // removed from the company
] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
