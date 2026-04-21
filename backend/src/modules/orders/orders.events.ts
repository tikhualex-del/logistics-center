import { AuditActorRole, OrderStatus } from '@prisma/client';
import { OrderResponseDto } from './dto/order-response.dto';

export interface OrderCreatedEvent {
  orderId: string;
  companyId: string;
  createdByUserId: string | null;
  requestId: string | null;
  order: OrderResponseDto;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  companyId: string;
  actorUserId: string;
  actorRole: AuditActorRole;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason: string | null;
  requestId: string | null;
  order: OrderResponseDto;
}
