import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PaymentCalculationProcessor } from './payment-calculation.processor';
import { PaymentsService } from './payments.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPaymentsService = {
  runPaymentCalculationJob: jest.fn(),
};

const paymentResponse = {
  id: 'payment-1',
  companyId: 'company-1',
  courierId: 'courier-1',
  paymentRuleVersionId: null,
  status: 'calculated',
  periodStart: new Date('2026-04-18T00:00:00.000Z'),
  periodEnd: new Date('2026-04-18T23:59:59.999Z'),
  currency: 'RUB',
  amount: '425.00',
  breakdown: {
    summary: {
      totalAmount: 425,
    },
  },
  approvedByUserId: null,
  approvedAt: null,
  paidAt: null,
  metadata: {
    calculatedByUserId: 'admin-1',
  },
  createdAt: new Date('2026-04-18T10:00:00.000Z'),
  updatedAt: new Date('2026-04-18T10:00:00.000Z'),
};

describe('PaymentCalculationProcessor', () => {
  let processor: PaymentCalculationProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentCalculationProcessor,
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    processor = module.get<PaymentCalculationProcessor>(
      PaymentCalculationProcessor,
    );
  });

  it('returns a success envelope for completed calculations', async () => {
    mockPaymentsService.runPaymentCalculationJob.mockResolvedValue(paymentResponse);

    await expect(
      processor.process({
        data: {
          companyId: 'company-1',
          actorUserId: 'admin-1',
          requestId: 'req-1',
          dto: {
            courierId: 'courier-1',
            periodStart: '2026-04-18T00:00:00.000Z',
            periodEnd: '2026-04-18T23:59:59.999Z',
            currency: 'RUB',
          },
        },
      } as never),
    ).resolves.toEqual({
      ok: true,
      payment: paymentResponse,
    });
  });

  it('normalizes known HTTP failures into an error envelope', async () => {
    mockPaymentsService.runPaymentCalculationJob.mockRejectedValue(
      new NotFoundException('Courier not found'),
    );

    await expect(
      processor.process({
        data: {
          companyId: 'company-1',
          actorUserId: 'admin-1',
          requestId: 'req-2',
          dto: {
            courierId: 'missing-courier',
            periodStart: '2026-04-18T00:00:00.000Z',
            periodEnd: '2026-04-18T23:59:59.999Z',
          },
        },
      } as never),
    ).resolves.toEqual({
      ok: false,
      error: {
        statusCode: 404,
        message: 'Courier not found',
      },
    });
  });

  it('normalizes unexpected failures into a 500 error envelope', async () => {
    mockPaymentsService.runPaymentCalculationJob.mockRejectedValue(
      new Error('Redis timeout'),
    );

    await expect(
      processor.process({
        data: {
          companyId: 'company-1',
          actorUserId: 'admin-1',
          requestId: 'req-3',
          dto: {
            courierId: 'courier-1',
            periodStart: '2026-04-18T00:00:00.000Z',
            periodEnd: '2026-04-18T23:59:59.999Z',
          },
        },
      } as never),
    ).resolves.toEqual({
      ok: false,
      error: {
        statusCode: 500,
        message: 'Redis timeout',
      },
    });
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
