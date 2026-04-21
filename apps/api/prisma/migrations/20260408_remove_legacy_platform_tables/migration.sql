-- Migration: remove_legacy_platform_tables
-- Removes Company, User, CompanyMembership from public schema.
-- These entities have moved to the system schema (system."Company")
-- and per-tenant schemas (User, Role, etc.) managed by TenantProvisioningService.
-- Cross-schema FK constraints on Order, Courier, AuditLog are dropped.
-- Enforcement of companyId correctness moves to the application layer.

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyMembership" DROP CONSTRAINT "CompanyMembership_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyMembership" DROP CONSTRAINT "CompanyMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Courier" DROP CONSTRAINT "Courier_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_companyId_fkey";

-- AlterTable (sync schema with Prisma model — field was added in earlier migration but missing from model)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isManuallyTouched" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "CompanyMembership";

-- DropTable
DROP TABLE "User";
