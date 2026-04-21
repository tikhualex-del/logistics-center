-- CreateTable
CREATE TABLE "external_id_map" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "integration_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "internal_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_id_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_id_map_company_id_entity_type_external_id_key"
ON "external_id_map"("company_id", "entity_type", "external_id");

-- CreateIndex
CREATE INDEX "external_id_map_company_id_entity_type_internal_id_idx"
ON "external_id_map"("company_id", "entity_type", "internal_id");

-- CreateIndex
CREATE INDEX "external_id_map_company_id_integration_id_idx"
ON "external_id_map"("company_id", "integration_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_events_company_id_direction_event_type_idempotency_key_key"
ON "integration_events"("company_id", "direction", "event_type", "idempotency_key");

-- AddForeignKey
ALTER TABLE "external_id_map"
ADD CONSTRAINT "external_id_map_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_id_map"
ADD CONSTRAINT "external_id_map_integration_id_fkey"
FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
