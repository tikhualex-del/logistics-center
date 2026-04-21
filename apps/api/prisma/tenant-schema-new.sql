CREATE SCHEMA IF NOT EXISTS "public";
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "UserRoleLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserRoleLink_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jwtId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AuditEntitySnapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT,
    CONSTRAINT "AuditEntitySnapshot_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AuditAccessEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditAccessEvent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AuditOverrideEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "superAdminId" TEXT,
    "userId" TEXT NOT NULL,
    "overrideType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditOverrideEvent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "externalSource" TEXT,
    "status" TEXT NOT NULL,
    "courierId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "deliveryLat" DOUBLE PRECISION,
    "deliveryLng" DOUBLE PRECISION,
    "scheduledPickupAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "cancelReason" TEXT,
    "failureReason" TEXT,
    "createdByUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
-- CreateIndex
CREATE INDEX "UserRoleLink_userId_idx" ON "UserRoleLink"("userId");
-- CreateIndex
CREATE INDEX "UserRoleLink_roleId_idx" ON "UserRoleLink"("roleId");
-- CreateIndex
CREATE UNIQUE INDEX "UserRoleLink_userId_roleId_key" ON "UserRoleLink"("userId", "roleId");
-- CreateIndex
CREATE UNIQUE INDEX "UserSession_jwtId_key" ON "UserSession"("jwtId");
-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
-- CreateIndex
CREATE INDEX "UserSession_jwtId_idx" ON "UserSession"("jwtId");
-- CreateIndex
CREATE INDEX "AuditEvent_companyId_createdAt_idx" ON "AuditEvent"("companyId", "createdAt");
-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");
-- CreateIndex
CREATE INDEX "AuditEntitySnapshot_entityType_entityId_idx" ON "AuditEntitySnapshot"("entityType", "entityId");
-- CreateIndex
CREATE INDEX "AuditEntitySnapshot_companyId_takenAt_idx" ON "AuditEntitySnapshot"("companyId", "takenAt");
-- CreateIndex
CREATE INDEX "AuditAccessEvent_companyId_createdAt_idx" ON "AuditAccessEvent"("companyId", "createdAt");
-- CreateIndex
CREATE INDEX "AuditAccessEvent_userId_idx" ON "AuditAccessEvent"("userId");
-- CreateIndex
CREATE INDEX "AuditOverrideEvent_companyId_createdAt_idx" ON "AuditOverrideEvent"("companyId", "createdAt");
-- CreateIndex
CREATE INDEX "Courier_companyId_idx" ON "Courier"("companyId");
-- CreateIndex
CREATE INDEX "Courier_status_idx" ON "Courier"("status");
-- CreateIndex
CREATE INDEX "Courier_companyId_status_idx" ON "Courier"("companyId", "status");
-- CreateIndex
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");
-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
-- CreateIndex
CREATE INDEX "Order_courierId_idx" ON "Order"("courierId");
-- CreateIndex
CREATE INDEX "Order_companyId_status_idx" ON "Order"("companyId", "status");
-- CreateIndex
CREATE INDEX "Order_companyId_courierId_idx" ON "Order"("companyId", "courierId");
-- CreateIndex
CREATE UNIQUE INDEX "Order_companyId_externalSource_externalId_key" ON "Order"("companyId", "externalSource", "externalId");
-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
