import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import {
  listCouriersHandler,
  getCourierHandler,
  createCourierHandler,
  updateCourierHandler,
} from './courier.controller';

const router = Router();

router.use(requireAuth);

// Reads: all authenticated tenant roles
router.get('/', requireRole('owner', 'dispatcher', 'viewer'), listCouriersHandler);
router.get('/:id', requireRole('owner', 'dispatcher', 'viewer'), getCourierHandler);

// Writes: owner and dispatcher only
router.post('/', requireRole('owner', 'dispatcher'), createCourierHandler);
router.patch('/:id', requireRole('owner', 'dispatcher'), updateCourierHandler);

export default router;
