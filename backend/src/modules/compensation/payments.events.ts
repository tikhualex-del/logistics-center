import { PaymentStatus } from '@prisma/client';
import { PaymentResponseDto } from './dto/payment-response.dto';

export interface PaymentCalculatedEvent {
  paymentId: string;
  companyId: string;
  actorUserId: string;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  requestId: string | null;
  payment: PaymentResponseDto;
}

export interface PaymentApprovedEvent {
  paymentId: string;
  companyId: string;
  actorUserId: string;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  requestId: string | null;
  payment: PaymentResponseDto;
}
