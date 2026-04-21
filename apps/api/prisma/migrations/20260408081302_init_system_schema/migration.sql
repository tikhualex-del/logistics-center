-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "system";

-- CreateTable
CREATE TABLE "system"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."PlatformSuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."PlatformImpersonationSession" (
    "id" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "PlatformImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."PlatformAuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "companyId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "system"."Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSuperAdmin_email_key" ON "system"."PlatformSuperAdmin"("email");

-- CreateIndex
CREATE INDEX "PlatformImpersonationSession_superAdminId_idx" ON "system"."PlatformImpersonationSession"("superAdminId");

-- CreateIndex
CREATE INDEX "PlatformImpersonationSession_targetCompanyId_idx" ON "system"."PlatformImpersonationSession"("targetCompanyId");

-- CreateIndex
CREATE INDEX "PlatformAuditEvent_actorId_createdAt_idx" ON "system"."PlatformAuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditEvent_targetType_targetId_idx" ON "system"."PlatformAuditEvent"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "PlatformAuditEvent_companyId_createdAt_idx" ON "system"."PlatformAuditEvent"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "system"."PlatformImpersonationSession" ADD CONSTRAINT "PlatformImpersonationSession_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "system"."PlatformSuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system"."PlatformImpersonationSession" ADD CONSTRAINT "PlatformImpersonationSession_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "system"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
