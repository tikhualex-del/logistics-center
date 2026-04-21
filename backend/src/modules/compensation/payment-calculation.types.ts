import type { PaymentResponseDto } from './dto/payment-response.dto';

export interface PaymentCalculationJobData {
  companyId: string;
  actorUserId: string;
  requestId: string | null;
  dto: {
    courierId: string;
    periodStart: string;
    periodEnd: string;
    currency?: string;
  };
}

export interface PaymentCalculationJobError {
  statusCode: number;
  message: string;
}

export type PaymentCalculationJobResult =
  | {
      ok: true;
      payment: PaymentResponseDto;
    }
  | {
      ok: false;
      error: PaymentCalculationJobError;
    };
