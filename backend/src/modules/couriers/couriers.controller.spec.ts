import { Test, type TestingModule } from '@nestjs/testing';
import { CourierStatus, UserRole } from '@prisma/client';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';
import { CourierAvailabilityStatus } from './dto/update-courier-status.dto';

const mockCouriersService = {
  listCouriers: jest.fn(),
  getCourier: jest.fn(),
  updateCourierStatus: jest.fn(),
  updateCourierLocation: jest.fn(),
};

const courierResponse = {
  id: 'courier-1',
  companyId: 'company-1',
  userId: 'user-1',
  status: CourierStatus.available,
  isOnline: true,
  email: 'courier@example.com',
  phone: '+79990000000',
  firstName: 'Pavel',
  lastName: 'Sidorov',
  isActive: true,
  latitude: 55.7558,
  longitude: 37.6173,
  lastSeenAt: new Date('2026-04-17T00:00:00.000Z'),
  createdAt: new Date('2026-04-16T10:00:00.000Z'),
  updatedAt: new Date('2026-04-17T00:00:00.000Z'),
};

describe('CouriersController', () => {
  let controller: CouriersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouriersController],
      providers: [{ provide: CouriersService, useValue: mockCouriersService }],
    }).compile();

    controller = module.get<CouriersController>(CouriersController);
  });

  it('lists couriers in tenant scope', async () => {
    mockCouriersService.listCouriers.mockResolvedValue([courierResponse]);

    await expect(controller.listCouriers('company-1')).resolves.toEqual([
      courierResponse,
    ]);
    expect(mockCouriersService.listCouriers).toHaveBeenCalledWith('company-1');
  });

  it('returns courier detail in tenant scope', async () => {
    mockCouriersService.getCourier.mockResolvedValue(courierResponse);

    await expect(controller.getCourier('company-1', 'courier-1')).resolves.toEqual(
      courierResponse,
    );
    expect(mockCouriersService.getCourier).toHaveBeenCalledWith(
      'company-1',
      'courier-1',
    );
  });

  it('updates courier status', async () => {
    const dto = { status: CourierAvailabilityStatus.offline };
    const updatedCourier = {
      ...courierResponse,
      status: CourierStatus.offline,
      isOnline: false,
    };
    mockCouriersService.updateCourierStatus.mockResolvedValue(updatedCourier);

    await expect(
      controller.updateCourierStatus('company-1', 'courier-1', dto),
    ).resolves.toEqual(updatedCourier);
    expect(mockCouriersService.updateCourierStatus).toHaveBeenCalledWith(
      'company-1',
      'courier-1',
      dto,
    );
  });

  it('updates courier location with actor context', async () => {
    const dto = { latitude: 55.8, longitude: 37.6 };
    const updatedCourier = {
      ...courierResponse,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
    mockCouriersService.updateCourierLocation.mockResolvedValue(updatedCourier);

    await expect(
      controller.updateCourierLocation(
        'company-1',
        'user-1',
        UserRole.courier,
        'courier-1',
        dto,
      ),
    ).resolves.toEqual(updatedCourier);
    expect(mockCouriersService.updateCourierLocation).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      UserRole.courier,
      'courier-1',
      dto,
    );
  });
});
