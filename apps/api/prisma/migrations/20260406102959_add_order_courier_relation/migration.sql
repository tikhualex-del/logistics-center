-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierId" TEXT;

-- CreateIndex
CREATE INDEX "Order_courierId_idx" ON "Order"("courierId");

-- CreateIndex
CREATE INDEX "Order_companyId_courierId_idx" ON "Order"("companyId", "courierId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
