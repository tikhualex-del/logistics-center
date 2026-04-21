import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import type { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { PAYMENT_CALCULATION_JOB, PAYMENT_CALCULATION_QUEUE } from './compensation.constants';
import { PaymentsService } from './payments.service';
import type {
  PaymentCalculationJobData,
  PaymentCalculationJobResult,
} from './payment-calculation.types';

@Injectable()
@Processor(PAYMENT_CALCULATION_QUEUE)
export class PaymentCalculationProcessor {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentCalculationProcessor.name);
  }

  @Process(PAYMENT_CALCULATION_JOB)
  async process(
    job: Job<PaymentCalculationJobData>,
  ): Promise<PaymentCalculationJobResult> {
    try {
      const payment = await this.paymentsService.runPaymentCalculationJob(
        job.data,
      );

      return {
        ok: true,
        payment,
      };
    } catch (error) {
      const normalizedError = normalizeJobError(error);

      this.logger.warn(
        {
          companyId: job.data.companyId,
          actorUserId: job.data.actorUserId,
          courierId: job.data.dto.courierId,
          error,
        },
        'Payment calculation job failed',
      );

      return {
        ok: false,
        error: normalizedError,
      };
    }
  }
}

function normalizeJobError(error: unknown): {
  statusCode: number;
  message: string;
} {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    return {
      statusCode: error.getStatus(),
      message: getHttpExceptionMessage(response),
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      statusCode: 500,
      message: error.message,
    };
  }

  const fallback = new BadRequestException('Payment calculation failed');
  const response = fallback.getResponse();

  return {
    statusCode: fallback.getStatus(),
    message: getHttpExceptionMessage(response),
  };
}

function getHttpExceptionMessage(response: string | object): string {
  if (typeof response === 'string' && response.trim()) {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const message = response['message'];

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return message.join('; ');
    }
  }

  return 'Payment calculation failed';
}
