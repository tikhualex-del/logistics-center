-- CreateIndex
CREATE INDEX "Order_companyId_deliveryDate_idx" ON "Order"("companyId", "deliveryDate");
