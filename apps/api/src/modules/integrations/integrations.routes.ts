import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { requireIntegrationKey } from './integrations.middleware';
import {
  listIntegrationsHandler,
  createIntegrationHandler,
  getIntegrationHandler,
  updateIntegrationHandler,
  getIntegrationLogsHandler,
  inboundOrderHandler,
} from './integrations.controller';

const router = Router();

// ─── Inbound endpoint ─────────────────────────────────────────────────────────
// API key auth only — no tenant JWT. Registered before /:id to prevent
// Express matching the literal string 'inbound' as a route param.
router.post('/inbound', requireIntegrationKey, inboundOrderHandler);

// ─── Management endpoints (tenant JWT auth) ───────────────────────────────────
router.get('/', requireAuth, requireRole('owner'), listIntegrationsHandler);
router.post('/', requireAuth, requireRole('owner'), createIntegrationHandler);
router.get('/:id', requireAuth, requireRole('owner'), getIntegrationHandler);
router.patch('/:id', requireAuth, requireRole('owner'), updateIntegrationHandler);
router.get('/:id/logs', requireAuth, requireRole('owner', 'dispatcher'), getIntegrationLogsHandler);

export default router;
