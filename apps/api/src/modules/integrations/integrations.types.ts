// ─── Integration management types ─────────────────────────────────────────────

export interface IntegrationResponse {
  id: string;
  companyId: string;
  name: string;
  externalSource: string;
  status: string;
  apiKeyPrefix: string;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Returned only at creation time — apiKey is the raw key, shown once and never stored.
export interface IntegrationCreateResponse extends IntegrationResponse {
  apiKey: string;
}

export interface CreateIntegrationInput {
  name: string;
  externalSource: string;
}

export interface UpdateIntegrationInput {
  name?: string;
  status?: string;
}

// ─── Inbound log types ────────────────────────────────────────────────────────

// rawPayload intentionally omitted from list response — use per-entry detail if needed.
export interface IntegrationInboundLogEntry {
  id: string;
  integrationId: string;
  companyId: string;
  externalId: string | null;
  status: string;
  orderId: string | null;
  errorMessage: string | null;
  createdAt: Date;
}

// ─── Inbound order input (from external payload) ──────────────────────────────

export interface InboundOrderInput {
  externalId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickupAt?: Date;
  deadline?: Date;
  notes?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
}
