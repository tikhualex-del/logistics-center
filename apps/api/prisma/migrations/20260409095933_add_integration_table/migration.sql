-- CreateTable
CREATE TABLE "system"."Integration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalSource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyPrefix" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_apiKeyHash_key" ON "system"."Integration"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Integration_companyId_idx" ON "system"."Integration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_companyId_externalSource_key" ON "system"."Integration"("companyId", "externalSource");

-- AddForeignKey
ALTER TABLE "system"."Integration" ADD CONSTRAINT "Integration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "system"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
