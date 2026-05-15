import { Test, type TestingModule } from '@nestjs/testing';
import { AuditActorRole, RouteStatus } from '@prisma/client';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';

const mockRoutingService = {
  buildRoute: jest.fn(),
  listRoutes: jest.fn(),
  getRoute: jest.fn(),
  updateRoute: jest.fn(),
  deleteRoute: jest.fn(),
};

const routeResponse = {
  id: 'route-1',
  companyId: 'company-1',
  courierId: 'courier-1',
  status: RouteStatus.draft,
  version: 1,
  routeDate: new Date('2026-04-18T09:00:00.000Z'),
  createdByUserId: 'user-1',
  totalDistanceMeters: 1800,
  totalDurationSeconds: 720,
  provider: 'mock-yandex',
  polyline: [
    { latitude: 55.751, longitude: 37.618 },
    { latitude: 55.758, longitude: 37.615 },
  ],
  routePoints: [],
  optimizationData: null,
  metadata: null,
  createdAt: new Date('2026-04-17T10:00:00.000Z'),
  updatedAt: new Date('2026-04-17T10:00:00.000Z'),
};

describe('RoutingController', () => {
  let controller: RoutingController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutingController],
      providers: [{ provide: RoutingService, useValue: mockRoutingService }],
    }).compile();

    controller = module.get<RoutingController>(RoutingController);
  });

  it('builds a route inside tenant scope', async () => {
    const dto = {
      orderIds: ['order-1', 'order-2'],
      courierId: 'courier-1',
      routeDate: new Date('2026-04-18T09:00:00.000Z'),
    };
    mockRoutingService.buildRoute.mockResolvedValue(routeResponse);

    await expect(
      controller.buildRoute(
        'company-1',
        'user-1',
        AuditActorRole.dispatcher,
        dto,
      ),
    ).resolves.toEqual(routeResponse);
    expect(mockRoutingService.buildRoute).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      dto,
      AuditActorRole.dispatcher,
    );
  });

  it('lists routes inside tenant scope', async () => {
    const query = {
      date: '2026-04-18',
      courierId: 'courier-1',
      status: RouteStatus.draft,
    };
    mockRoutingService.listRoutes.mockResolvedValue([routeResponse]);

    await expect(controller.listRoutes('company-1', query)).resolves.toEqual([
      routeResponse,
    ]);
    expect(mockRoutingService.listRoutes).toHaveBeenCalledWith(
      'company-1',
      query,
    );
  });

  it('returns route detail inside tenant scope', async () => {
    mockRoutingService.getRoute.mockResolvedValue(routeResponse);

    await expect(controller.getRoute('company-1', 'route-1')).resolves.toEqual(
      routeResponse,
    );
    expect(mockRoutingService.getRoute).toHaveBeenCalledWith(
      'company-1',
      'route-1',
    );
  });

  it('updates route inside tenant scope', async () => {
    const dto = {
      orderIds: ['order-2', 'order-1'],
      status: RouteStatus.planned,
    };
    const updatedRoute = {
      ...routeResponse,
      status: RouteStatus.planned,
      version: 2,
    };
    mockRoutingService.updateRoute.mockResolvedValue(updatedRoute);

    await expect(
      controller.updateRoute(
        'company-1',
        'user-1',
        AuditActorRole.dispatcher,
        'route-1',
        dto,
      ),
    ).resolves.toEqual(updatedRoute);
    expect(mockRoutingService.updateRoute).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      'route-1',
      dto,
      AuditActorRole.dispatcher,
    );
  });

  it('deletes route inside tenant scope', async () => {
    const deletedRoute = {
      ...routeResponse,
      status: RouteStatus.cancelled,
    };
    mockRoutingService.deleteRoute.mockResolvedValue(deletedRoute);

    await expect(
      controller.deleteRoute('company-1', 'user-1', 'route-1'),
    ).resolves.toEqual(deletedRoute);
    expect(mockRoutingService.deleteRoute).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      'route-1',
    );
  });
});
