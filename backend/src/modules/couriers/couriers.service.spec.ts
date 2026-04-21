import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CourierStatus, Prisma, UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CouriersService } from './couriers.service';
import { CourierAvailabilityStatus } from './dto/update-courier-status.dto';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockEventEmitter = {
  emitAsync: jest.fn(),
};

const mockPrismaService = {
  courier: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

const baseCourier = {
  id: 'courier-1',
  company_id: 'company-1',
  user_id: 'user-1',
  status: CourierStatus.available,
  latitude: new Prisma.Decimal('55.7558000'),
  longitude: new Prisma.Decimal('37.6173000'),
  last_seen_at: new Date('2026-04-17T00:00:00.000Z'),
  created_at: new Date('2026-04-16T10:00:00.000Z'),
  updated_at: new Date('2026-04-17T00:00:00.000Z'),
  user: {
    id: 'user-1',
    email: 'courier@example.com',
    phone: '+79990000000',
    first_name: 'Pavel',
    last_name: 'Sidorov',
    is_active: true,
  },
};

describe('CouriersService', () => {
  let service: CouriersService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockEventEmitter.emitAsync.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouriersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<CouriersService>(CouriersService);
  });

  it('lists tenant couriers', async () => {
    mockPrismaService.courier.findMany.mockResolvedValue([baseCourier]);

    const result = await service.listCouriers('company-1');

    expect(mockPrismaService.courier.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'courier-1',
        companyId: 'company-1',
        status: CourierStatus.available,
        isOnline: true,
      }),
    ]);
  });

  it('returns one tenant courier by id', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(baseCourier);

    const result = await service.getCourier('company-1', 'courier-1');

    expect(mockPrismaService.courier.findFirst).toHaveBeenCalledWith({
      where: { id: 'courier-1' },
      select: expect.any(Object),
    });
    expect(result.email).toBe(baseCourier.user.email);
  });

  it('throws when courier is missing', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(null);

    await expect(service.getCourier('company-1', 'missing-courier')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps online toggle to available status', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(baseCourier);
    mockPrismaService.courier.update.mockResolvedValue({
      ...baseCourier,
      status: CourierStatus.available,
    });

    const result = await service.updateCourierStatus('company-1', 'courier-1', {
      status: CourierAvailabilityStatus.online,
    });

    expect(mockPrismaService.courier.update).toHaveBeenCalledWith({
      where: { id: 'courier-1' },
      data: {
        status: CourierStatus.available,
        last_seen_at: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(result.status).toBe(CourierStatus.available);
    expect(result.isOnline).toBe(true);
  });

  it('rejects suspended courier status toggle', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue({
      ...baseCourier,
      status: CourierStatus.suspended,
    });

    await expect(
      service.updateCourierStatus('company-1', 'courier-1', {
        status: CourierAvailabilityStatus.offline,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates courier location for self courier actor', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(baseCourier);
    mockPrismaService.courier.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseCourier,
        latitude: data.latitude,
        longitude: data.longitude,
        last_seen_at: data.last_seen_at,
      }),
    );

    const result = await service.updateCourierLocation(
      'company-1',
      'user-1',
      UserRole.courier,
      'courier-1',
      {
        latitude: 55.8,
        longitude: 37.6,
      },
    );

    expect(mockPrismaService.courier.update).toHaveBeenCalledWith({
      where: { id: 'courier-1' },
      data: {
        latitude: expect.any(Prisma.Decimal),
        longitude: expect.any(Prisma.Decimal),
        last_seen_at: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
      DOMAIN_EVENTS.COURIER.LOCATION_UPDATED,
      expect.objectContaining({
        courierId: 'courier-1',
        companyId: 'company-1',
        actorUserId: 'user-1',
        actorRole: UserRole.courier,
        requestId: null,
        latitude: 55.8,
        longitude: 37.6,
      }),
    );
    expect(result.latitude).toBeCloseTo(55.8);
    expect(result.longitude).toBeCloseTo(37.6);
  });

  it('forbids courier from updating another courier location', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(baseCourier);

    await expect(
      service.updateCourierLocation(
        'company-1',
        'user-2',
        UserRole.courier,
        'courier-1',
        {
          latitude: 55.8,
          longitude: 37.6,
        },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
  });

  it('does not fail location update when event emission fails', async () => {
    mockPrismaService.courier.findFirst.mockResolvedValue(baseCourier);
    mockPrismaService.courier.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseCourier,
        latitude: data.latitude,
        longitude: data.longitude,
        last_seen_at: data.last_seen_at,
      }),
    );
    mockEventEmitter.emitAsync.mockRejectedValueOnce(new Error('broker down'));

    const result = await service.updateCourierLocation(
      'company-1',
      'dispatcher-1',
      UserRole.dispatcher,
      'courier-1',
      {
        latitude: 55.9,
        longitude: 37.7,
      },
    );

    expect(result.latitude).toBeCloseTo(55.9);
    expect(result.longitude).toBeCloseTo(37.7);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        courierId: 'courier-1',
        companyId: 'company-1',
        actorUserId: 'dispatcher-1',
        actorRole: UserRole.dispatcher,
        error: expect.any(Error),
      }),
      'Courier location-updated event emission failed',
    );
  });
});
