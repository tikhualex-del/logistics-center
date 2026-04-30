-- Platform company metadata and super-admin support for Phase 11.5.

CREATE TYPE "CompanyStatus" AS ENUM (
  'active',
  'inactive',
  'suspended',
  'trial',
  'pending_setup',
  'archived'
);

CREATE TYPE "PlatformAdminStatus" AS ENUM ('active', 'suspended');

CREATE TYPE "PlatformAuditActorType" AS ENUM ('super_admin', 'system');

ALTER TABLE "companies"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "status" "CompanyStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "default_currency" TEXT NOT NULL DEFAULT 'RUB',
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'ru',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'RU',
  ADD COLUMN "contact_email" TEXT,
  ADD COLUMN "contact_phone" TEXT,
  ADD COLUMN "plan_id" TEXT;

UPDATE "companies"
SET "slug" = 'company-' || "id"
WHERE "slug" IS NULL;

ALTER TABLE "companies"
  ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

CREATE TABLE "platform_super_admins" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "status" "PlatformAdminStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "platform_super_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_super_admins_email_key"
  ON "platform_super_admins"("email");

CREATE TABLE "platform_impersonation_sessions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "super_admin_id" TEXT NOT NULL,
  "target_company_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  "reason" TEXT,

  CONSTRAINT "platform_impersonation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_impersonation_sessions_super_admin_id_idx"
  ON "platform_impersonation_sessions"("super_admin_id");

CREATE INDEX "platform_impersonation_sessions_target_company_id_idx"
  ON "platform_impersonation_sessions"("target_company_id");

CREATE INDEX "platform_impersonation_sessions_super_admin_id_target_company_id_ended_at_idx"
  ON "platform_impersonation_sessions"("super_admin_id", "target_company_id", "ended_at");

ALTER TABLE "platform_impersonation_sessions"
  ADD CONSTRAINT "platform_impersonation_sessions_super_admin_id_fkey"
  FOREIGN KEY ("super_admin_id") REFERENCES "platform_super_admins"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "platform_impersonation_sessions"
  ADD CONSTRAINT "platform_impersonation_sessions_target_company_id_fkey"
  FOREIGN KEY ("target_company_id") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "platform_audit_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "actor_type" "PlatformAuditActorType" NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" TEXT,
  "company_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_audit_events_actor_id_created_at_idx"
  ON "platform_audit_events"("actor_id", "created_at");

CREATE INDEX "platform_audit_events_target_type_target_id_idx"
  ON "platform_audit_events"("target_type", "target_id");

CREATE INDEX "platform_audit_events_company_id_created_at_idx"
  ON "platform_audit_events"("company_id", "created_at");

ALTER TABLE "platform_audit_events"
  ADD CONSTRAINT "platform_audit_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "platform_super_admins"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_audit_events"
  ADD CONSTRAINT "platform_audit_events_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
