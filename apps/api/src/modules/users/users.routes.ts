import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  changeRoleHandler,
} from './users.controller';

export const usersRouter = Router();

// All endpoints require authentication and owner role.
usersRouter.use(requireAuth, requireRole('owner'));

usersRouter.get('/', listUsersHandler);
usersRouter.post('/', createUserHandler);
usersRouter.get('/:id', getUserHandler);
usersRouter.patch('/:id', updateUserHandler);
usersRouter.put('/:id/role', changeRoleHandler);
