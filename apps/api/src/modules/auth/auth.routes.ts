import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  platformLoginHandler,
  platformLogoutHandler,
} from './auth.controller';

export const authRouter = Router();

// Tenant user auth
authRouter.post('/login', loginHandler);
authRouter.post('/logout', requireAuth, logoutHandler);
authRouter.get('/me', requireAuth, meHandler);

// Platform super admin auth
authRouter.post('/platform/login', platformLoginHandler);
authRouter.post('/platform/logout', requireAuth, platformLogoutHandler);
