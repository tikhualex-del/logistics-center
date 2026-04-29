import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentStatus } from '@prisma/client';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

const mockPaymentsService = {
  listPayments: jest.fn(),
  getPayment: jest.fn(),
  calculatePayment: jest.fn(),
  updatePaymentStatus: jest.fn(),
};

const paymentResponse = {
  id: 'payment-1',
  companyId: 'company-1',
  courierId: 'courier-1',
  paymentRuleVersionId: null,
  status: PaymentStatus.calculated,
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

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('calculates payment in tenant scope', async () => {
    const dto = {
      courierId: 'courier-1',
      periodStart: new Date('2026-04-18T00:00:00.000Z'),
      periodEnd: new Date('2026-04-18T23:59:59.999Z'),
      currency: 'RUB',
    };
    mockPaymentsService.calculatePayment.mockResolvedValue(paymentResponse);

    await expect(
      controller.calculatePayment('company-1', 'admin-1', dto),
    ).resolves.toEqual(paymentResponse);
    expect(mockPaymentsService.calculatePayment).toHaveBeenCalledWith(
      'company-1',
      'admin-1',
      dto,
    );
  });

  it('lists payments for the current company', async () => {
    const query = {
      status: PaymentStatus.calculated,
      limit: 25,
    };
    mockPaymentsService.listPayments.mockResolvedValue([paymentResponse]);

    await expect(controller.listPayments('company-1', query)).resolves.toEqual([
      paymentResponse,
    ]);
    expect(mockPaymentsService.listPayments).toHaveBeenCalledWith(
      'company-1',
      query,
    );
  });

  it('returns payment detail in tenant scope', async () => {
    mockPaymentsService.getPayment.mockResolvedValue(paymentResponse);

    await expect(
      controller.getPayment('company-1', 'payment-1'),
    ).resolves.toEqual(paymentResponse);
    expect(mockPaymentsService.getPayment).toHaveBeenCalledWith(
      'company-1',
      'payment-1',
    );
  });

  it('updates payment status in tenant scope', async () => {
    const dto = {
      status: PaymentStatus.approved,
      reason: 'Finance approved the calculation',
    };
    const approvedPayment = {
      ...paymentResponse,
      status: PaymentStatus.approved,
      approvedByUserId: 'admin-1',
      approvedAt: new Date('2026-04-18T12:00:00.000Z'),
    };
    mockPaymentsService.updatePaymentStatus.mockResolvedValue(approvedPayment);

    await expect(
      controller.updatePaymentStatus('company-1', 'admin-1', 'payment-1', dto),
    ).resolves.toEqual(approvedPayment);
    expect(mockPaymentsService.updatePaymentStatus).toHaveBeenCalledWith(
      'company-1',
      'admin-1',
      'payment-1',
      dto,
    );
  });
});
