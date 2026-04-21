import { Test, type TestingModule } from '@nestjs/testing';
import { AuditActorRole, OrderStatus } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

const mockOrdersService = {
  createOrder: jest.fn(),
  listOrders: jest.fn(),
  getOrder: jest.fn(),
  updateOrder: jest.fn(),
  transitionOrderStatus: jest.fn(),
};

const orderResponse = {
  id: 'order-1',
  companyId: 'company-1',
  status: OrderStatus.new,
  externalId: 'crm-order-1',
  orderNumber: 'ORD-1',
  customerName: 'Ivan Petrov',
  customerPhone: '+79990000000',
  deliveryAddress: 'Moscow, Tverskaya 1',
  deliveryLatitude: 55.7558,
  deliveryLongitude: 37.6173,
  comment: 'Leave at reception',
  scheduledDate: new Date('2026-04-16T10:00:00.000Z'),
  timeWindowFrom: new Date('2026-04-16T12:00:00.000Z'),
  timeWindowTo: new Date('2026-04-16T14:00:00.000Z'),
  zoneId: 'zone-1',
  assignedCourierId: 'courier-1',
  createdByUserId: 'user-1',
  assignedByUserId: 'user-1',
  metadata: { source: 'dispatcher' },
  createdAt: new Date('2026-04-16T10:00:00.000Z'),
  updatedAt: new Date('2026-04-16T10:00:00.000Z'),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockOrdersService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('creates order inside tenant scope with actor id', async () => {
    const dto = {
      deliveryAddress: orderResponse.deliveryAddress,
      customerName: orderResponse.customerName,
      zoneId: orderResponse.zoneId,
    };
    mockOrdersService.createOrder.mockResolvedValue(orderResponse);

    await expect(
      controller.createOrder('company-1', 'user-1', dto),
    ).resolves.toEqual(orderResponse);
    expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      dto,
    );
  });

  it('lists orders with filters', async () => {
    const filters = {
      status: OrderStatus.new,
      zoneId: 'zone-1',
      date: '2026-04-16',
    };
    mockOrdersService.listOrders.mockResolvedValue([orderResponse]);

    await expect(controller.listOrders('company-1', filters)).resolves.toEqual([
      orderResponse,
    ]);
    expect(mockOrdersService.listOrders).toHaveBeenCalledWith(
      'company-1',
      filters,
    );
  });

  it('returns one order by id', async () => {
    mockOrdersService.getOrder.mockResolvedValue(orderResponse);

    await expect(controller.getOrder('company-1', 'order-1')).resolves.toEqual(
      orderResponse,
    );
    expect(mockOrdersService.getOrder).toHaveBeenCalledWith(
      'company-1',
      'order-1',
    );
  });

  it('updates order inside tenant scope', async () => {
    const dto = {
      comment: 'Call on arrival',
      assignedCourierId: 'courier-2',
    };
    const updatedOrder = {
      ...orderResponse,
      comment: dto.comment,
      assignedCourierId: dto.assignedCourierId,
      assignedByUserId: 'user-1',
    };
    mockOrdersService.updateOrder.mockResolvedValue(updatedOrder);

    await expect(
      controller.updateOrder('company-1', 'user-1', 'order-1', dto),
    ).resolves.toEqual(updatedOrder);
    expect(mockOrdersService.updateOrder).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      'order-1',
      dto,
    );
  });

  it('transitions order status inside tenant scope', async () => {
    const dto = {
      status: OrderStatus.confirmed,
      reason: 'Dispatcher confirmed order',
    };
    const transitionedOrder = {
      ...orderResponse,
      status: OrderStatus.confirmed,
    };
    mockOrdersService.transitionOrderStatus.mockResolvedValue(transitionedOrder);

    await expect(
      controller.updateOrderStatus(
        'company-1',
        'user-1',
        AuditActorRole.dispatcher,
        'order-1',
        dto,
      ),
    ).resolves.toEqual(transitionedOrder);
    expect(mockOrdersService.transitionOrderStatus).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      AuditActorRole.dispatcher,
      'order-1',
      dto,
    );
  });
});
