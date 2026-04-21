import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import {
  listRoutesHandler,
  createRouteHandler,
  getRouteHandler,
  updateRouteHandler,
  addOrderToRouteHandler,
  removeOrderFromRouteHandler,
  reorderRouteOrderHandler,
  assignRouteHandler,
  completeRouteHandler,
  cancelRouteHandler,
} from './routes.controller';

const router = Router();

router.use(requireAuth);

// Reads: all authenticated tenant roles
router.get('/', requireRole('owner', 'dispatcher', 'viewer'), listRoutesHandler);
router.get('/:id', requireRole('owner', 'dispatcher', 'viewer'), getRouteHandler);

// Writes: owner and dispatcher only
router.post('/', requireRole('owner', 'dispatcher'), createRouteHandler);
router.patch('/:id', requireRole('owner', 'dispatcher'), updateRouteHandler);
router.post('/:id/orders', requireRole('owner', 'dispatcher'), addOrderToRouteHandler);
router.delete('/:id/orders/:orderId', requireRole('owner', 'dispatcher'), removeOrderFromRouteHandler);
router.patch('/:id/orders/:orderId', requireRole('owner', 'dispatcher'), reorderRouteOrderHandler);
router.post('/:id/assign', requireRole('owner', 'dispatcher'), assignRouteHandler);
router.post('/:id/complete', requireRole('owner', 'dispatcher'), completeRouteHandler);
router.post('/:id/cancel', requireRole('owner', 'dispatcher'), cancelRouteHandler);

export default router;
