import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { systemPrisma } from '../../lib/prisma-system';
import { AppError } from '../../middlewares/error.middleware';

// Authenticates inbound requests via X-Api-Key header.
// Resolves the Integration record and attaches integrationContext to req.
// Does not use tenant JWT — the API key is the sole auth mechanism for inbound.
export async function requireIntegrationKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    throw new AppError(401, 'X-Api-Key header is required');
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const integration = await systemPrisma.integration.findUnique({
    where: { apiKeyHash: keyHash },
    select: { id: true, companyId: true, externalSource: true, status: true },
  });

  if (!integration) throw new AppError(401, 'Invalid API key');
  if (integration.status !== 'active') throw new AppError(403, 'Integration is inactive');

  req.integrationContext = {
    integrationId: integration.id,
    companyId: integration.companyId,
    externalSource: integration.externalSource,
  };

  next();
}
