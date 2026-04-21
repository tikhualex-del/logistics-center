import crypto from 'crypto';
import { systemPrisma } from '../../lib/prisma-system';
import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import { validateInboundOrder, extractExternalId } from './integrations.validation';
import type {
  IntegrationResponse,
  IntegrationCreateResponse,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationInboundLogEntry,
} from './integrations.types';
import type { IntegrationContext } from '../../types/express';
import type { OrderResponse } from '../orders/order.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INTEGRATION_SELECT = {
  id: true,
  companyId: true,
  name: true,
  externalSource: true,
  status: true,
  apiKeyPrefix: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const LOG_SELECT = {
  id: true,
  integrationId: true,
  companyId: true,
  externalId: true,
  status: true,
  orderId: true,
  errorMessage: true,
  createdAt: true,
} as const;

// Mirrors ORDER_SELECT from order.service — inlined to avoid cross-module coupling.
const ORDER_SELECT = {
  id: true,
  companyId: true,
  source: true,
  externalId: true,
  externalSource: true,
  status: true,
  courierId: true,
  customerName: true,
  customerPhone: true,
  pickupAddress: true,
  deliveryAddress: true,
  pickupLat: true,
  pickupLng: true,
  deliveryLat: true,
  deliveryLng: true,
  scheduledPickupAt: true,
  deadline: true,
  notes: true,
  cancelReason: true,
  failureReason: true,
  createdByUserId: true,
  assignedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  cancelledAt: true,
  failedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const randomHex = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const rawKey = `lc_${randomHex}`;
  const keyPrefix = randomHex.substring(0, 8);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyPrefix, keyHash };
}

// ─── Management service functions ──────────────────────────────────────────────

export async function listIntegrations(companyId: string): Promise<IntegrationResponse[]> {
  return systemPrisma.integration.findMany({
    where: { companyId },
    select: INTEGRATION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createIntegration(
  companyId: string,
  input: CreateIntegrationInput,
  actor: { actorId: string | null },
): Promise<IntegrationCreateResponse> {
  const { rawKey, keyPrefix, keyHash } = generateApiKey();

  try {
    const integration = await systemPrisma.integration.create({
      data: {
        companyId,
        name: input.name,
        externalSource: input.externalSource,
        status: 'active',
        apiKeyHash: keyHash,
        apiKeyPrefix: keyPrefix,
        createdByUserId: actor.actorId,
      },
      select: INTEGRATION_SELECT,
    });
    return { ...integration, apiKey: rawKey };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === 'P2002') {
      throw new AppError(409, `Integration with externalSource '${input.externalSource}' already exists for this company`);
    }
    throw e;
  }
}

export async function getIntegration(companyId: string, integrationId: string): Promise<IntegrationResponse> {
  const row = await systemPrisma.integration.findUnique({
    where: { id: integrationId },
    select: INTEGRATION_SELECT,
  });
  if (!row || row.companyId !== companyId) throw new AppError(404, 'Integration not found');
  return row;
}

export async function updateIntegration(
  companyId: string,
  integrationId: string,
  input: UpdateIntegrationInput,
): Promise<IntegrationResponse> {
  const existing = await systemPrisma.integration.findUnique({
    where: { id: integrationId },
    select: { id: true, companyId: true },
  });
  if (!existing || existing.companyId !== companyId) throw new AppError(404, 'Integration not found');

  return systemPrisma.integration.update({
    where: { id: integrationId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.status !== undefined && { status: input.status }),
    },
    select: INTEGRATION_SELECT,
  });
}

export async function getIntegrationLogs(
  companyId: string,
  integrationId: string,
  pagination: { limit: number; offset: number },
): Promise<IntegrationInboundLogEntry[]> {
  const integration = await systemPrisma.integration.findUnique({
    where: { id: integrationId },
    select: { id: true, companyId: true },
  });
  if (!integration || integration.companyId !== companyId) throw new AppError(404, 'Integration not found');

  const tenantPrisma = getTenantPrisma(companyId);
  return (tenantPrisma as any).integrationInboundLog.findMany({
    where: { integrationId },
    select: LOG_SELECT,
    orderBy: { createdAt: 'desc' },
    take: pagination.limit,
    skip: pagination.offset,
  });
}

// ─── Inbound order processing ─────────────────────────────────────────────────

export async function processInboundOrder(
  ctx: IntegrationContext,
  rawBody: unknown,
): Promise<{ httpStatus: 201 | 200; order: OrderResponse }> {
  const tenantPrisma = getTenantPrisma(ctx.companyId);

  // ── Validate first — write invalid log outside transaction ────────────────
  let input;
  try {
    input = validateInboundOrder(rawBody);
  } catch (validationError: unknown) {
    const err = validationError as { message?: string };
    await (tenantPrisma as any).integrationInboundLog.create({
      data: {
        integrationId: ctx.integrationId,
        companyId: ctx.companyId,
        rawPayload: rawBody ?? {},
        externalId: extractExternalId(rawBody),
        status: 'invalid',
        orderId: null,
        errorMessage: err.message ?? 'Validation failed',
      },
    });
    throw validationError;
  }

  // ── Success path — order + history + log in one transaction ──────────────
  try {
    const order = await (tenantPrisma as any).$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          companyId: ctx.companyId,
          source: 'integration',
          externalId: input.externalId,
          externalSource: ctx.externalSource,
          status: 'new',
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          pickupAddress: input.pickupAddress,
          deliveryAddress: input.deliveryAddress,
          scheduledPickupAt: input.scheduledPickupAt ?? null,
          deadline: input.deadline ?? null,
          notes: input.notes ?? null,
          pickupLat: input.pickupLat ?? null,
          pickupLng: input.pickupLng ?? null,
          deliveryLat: input.deliveryLat ?? null,
          deliveryLng: input.deliveryLng ?? null,
          createdByUserId: null,
        },
        select: ORDER_SELECT,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: 'new',
          actorType: 'integration',
          actorId: ctx.integrationId,
          reason: null,
        },
      });

      await tx.integrationInboundLog.create({
        data: {
          integrationId: ctx.integrationId,
          companyId: ctx.companyId,
          rawPayload: rawBody ?? {},
          externalId: input.externalId,
          status: 'success',
          orderId: created.id,
          errorMessage: null,
        },
      });

      return created;
    });

    return { httpStatus: 201, order };

  } catch (e: unknown) {
    const err = e as { code?: string };

    // ── Duplicate path — find existing + log in one transaction ──────────
    if (err.code === 'P2002') {
      const result = await (tenantPrisma as any).$transaction(async (tx: any) => {
        const existing = await tx.order.findFirst({
          where: {
            companyId: ctx.companyId,
            externalSource: ctx.externalSource,
            externalId: input.externalId,
          },
          select: ORDER_SELECT,
        });

        await tx.integrationInboundLog.create({
          data: {
            integrationId: ctx.integrationId,
            companyId: ctx.companyId,
            rawPayload: rawBody ?? {},
            externalId: input.externalId,
            status: 'duplicate',
            orderId: existing?.id ?? null,
            errorMessage: null,
          },
        });

        return existing;
      });

      return { httpStatus: 200, order: result };
    }

    // ── Unexpected error — best-effort log, then rethrow ─────────────────
    try {
      await (tenantPrisma as any).integrationInboundLog.create({
        data: {
          integrationId: ctx.integrationId,
          companyId: ctx.companyId,
          rawPayload: rawBody ?? {},
          externalId: extractExternalId(rawBody),
          status: 'error',
          orderId: null,
          errorMessage: (e as Error).message ?? 'Unknown error',
        },
      });
    } catch {
      // Swallow log failure — original error takes priority
    }

    throw e;
  }
}
