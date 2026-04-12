import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireSuperAdmin } from '../../middlewares/rbac.middleware';
import {
  seedOwnerHandler,
  listTenantUsersHandler,
  listAdminsHandler,
  createAdminHandler,
  getAdminHandler,
  updateAdminHandler,
} from './platform.controller';
import { impersonationRouter } from './impersonation';

export const platformRouter = Router();

// All platform endpoints require super admin authentication.
platformRouter.use(requireAuth, requireSuperAdmin());

// ─── Company / tenant operations ──────────────────────────────────────────────

// Bootstrap-only. Creates the first owner in an empty tenant.
platformRouter.post('/companies/:id/seed-owner', seedOwnerHandler);

// Read-only support visibility. Not a user management path.
platformRouter.get('/companies/:id/users', listTenantUsersHandler);

// ─── Super admin management ───────────────────────────────────────────────────

platformRouter.get('/admins', listAdminsHandler);
platformRouter.post('/admins', createAdminHandler);
platformRouter.get('/admins/:id', getAdminHandler);
platformRouter.patch('/admins/:id', updateAdminHandler);

// ─── Impersonation ────────────────────────────────────────────────────────────
// Protected by the mount-level requireSuperAdmin() — impersonation tokens cannot
// reach these routes.
platformRouter.use('/impersonate', impersonationRouter);
