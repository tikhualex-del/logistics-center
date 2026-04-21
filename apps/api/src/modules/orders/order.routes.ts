import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import {
  listOrdersHandler,
  getOrderHandler,
  createOrderHandler,
  updateOrderHandler,
  assignOrderHandler,
  unassignOrderHandler,
  pickupOrderHandler,
  deliverOrderHandler,
  failOrderHandler,
  cancelOrderHandler,
  requeueOrderHandler,
} from './order.controller';

const router = Router();

router.use(requireAuth);

// Reads: all authenticated tenant roles
router.get('/', requireRole('owner', 'dispatcher', 'viewer'), listOrdersHandler);
router.get('/:id', requireRole('owner', 'dispatcher', 'viewer'), getOrderHandler);

// Writes: owner and dispatcher only
router.post('/', requireRole('owner', 'dispatcher'), createOrderHandler);
router.patch('/:id', requireRole('owner', 'dispatcher'), updateOrderHandler);
router.post('/:id/assign', requireRole('owner', 'dispatcher'), assignOrderHandler);
router.post('/:id/unassign', requireRole('owner', 'dispatcher'), unassignOrderHandler);
router.post('/:id/pickup', requireRole('owner', 'dispatcher'), pickupOrderHandler);
router.post('/:id/deliver', requireRole('owner', 'dispatcher'), deliverOrderHandler);
router.post('/:id/fail', requireRole('owner', 'dispatcher'), failOrderHandler);
router.post('/:id/cancel', requireRole('owner', 'dispatcher'), cancelOrderHandler);
router.post('/:id/requeue', requireRole('owner', 'dispatcher'), requeueOrderHandler);

export default router;
