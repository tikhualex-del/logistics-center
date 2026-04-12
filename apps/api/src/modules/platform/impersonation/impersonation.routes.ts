import { Router } from 'express';
import {
  startImpersonationHandler,
  endImpersonationHandler,
  listImpersonationSessionsHandler,
} from './impersonation.controller';

// These routes are mounted inside platformRouter which already applies
// requireAuth + requireSuperAdmin(). Impersonation tokens cannot reach here.
export const impersonationRouter = Router();

impersonationRouter.post('/:companyId', startImpersonationHandler);
impersonationRouter.post('/:sessionId/end', endImpersonationHandler);
impersonationRouter.get('/', listImpersonationSessionsHandler);
