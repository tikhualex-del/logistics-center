import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { ZonesService } from './zones.service';
import type { GeoJsonPolygon } from './validators/is-geo-json-polygon.decorator';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockPrismaService = {
  zone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

const zonePolygon: GeoJsonPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [37.6173, 55.7558],
      [37.6273, 55.7558],
      [37.6273, 55.7658],
      [37.6173, 55.7558],
    ],
  ],
};

const baseZone = {
  id: 'zone-1',
  company_id: 'company-1',
  name: 'Central District',
  polygon: zonePolygon,
  color: '#34C759',
  base_rate: new Prisma.Decimal('250.00'),
  is_active: true,
  created_at: new Date('2026-04-16T10:00:00.000Z'),
  updated_at: new Date('2026-04-16T10:00:00.000Z'),
};

describe('ZonesService', () => {
  let service: ZonesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
  });

  it('lists active tenant zones ordered by creation date', async () => {
    mockPrismaService.zone.findMany.mockResolvedValue([baseZone]);

    const result = await service.listZones('company-1');

    expect(mockPrismaService.zone.findMany).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: [{ created_at: 'desc' }],
      select: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: baseZone.id,
        companyId: baseZone.company_id,
        name: baseZone.name,
        baseRate: '250.00',
      }),
    ]);
  });

  it('returns a single tenant zone', async () => {
    mockPrismaService.zone.findFirst.mockResolvedValue(baseZone);

    const result = await service.getZone('company-1', 'zone-1');

    expect(mockPrismaService.zone.findFirst).toHaveBeenCalledWith({
      where: { id: 'zone-1', is_active: true },
      select: expect.any(Object),
    });
    expect(result.id).toBe('zone-1');
  });

  it('throws when requesting missing zone', async () => {
    mockPrismaService.zone.findFirst.mockResolvedValue(null);

    await expect(service.getZone('company-1', 'missing-zone')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a zone with decimal base rate and tenant company id', async () => {
    mockPrismaService.zone.findFirst.mockResolvedValue(null);
    mockPrismaService.zone.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseZone,
        id: 'zone-2',
        company_id: data.company_id,
        name: data.name,
        polygon: data.polygon,
        color: data.color,
        base_rate: data.base_rate,
      }),
    );

    const result = await service.createZone('company-1', {
      name: 'North District',
      polygon: baseZone.polygon,
      color: '#FF9500',
      baseRate: 180,
    });

    expect(mockPrismaService.zone.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company_id: 'company-1',
          name: 'North District',
          color: '#FF9500',
          base_rate: expect.any(Prisma.Decimal),
        }),
      }),
    );
    expect(result.baseRate).toBe('180.00');
  });

  it('rejects duplicate zone name inside company scope', async () => {
    mockPrismaService.zone.findFirst.mockResolvedValue({ id: 'existing-zone' });

    await expect(
      service.createZone('company-1', {
        name: baseZone.name,
        polygon: baseZone.polygon,
        color: baseZone.color,
        baseRate: 250,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates zone fields and allows null base rate', async () => {
    mockPrismaService.zone.findFirst
      .mockResolvedValueOnce(baseZone)
      .mockResolvedValueOnce(null);
    mockPrismaService.zone.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseZone,
        name: data.name ?? baseZone.name,
        color:
          data.color !== undefined
            ? (data.color as string | null)
            : baseZone.color,
        base_rate: data.base_rate,
        is_active: data.is_active ?? baseZone.is_active,
      }),
    );

    const result = await service.updateZone('company-1', 'zone-1', {
      name: 'Updated District',
      color: null,
      baseRate: null,
      isActive: false,
    });

    expect(mockPrismaService.zone.update).toHaveBeenCalledWith({
      where: { id: 'zone-1' },
      data: {
        name: 'Updated District',
        color: null,
        base_rate: null,
        is_active: false,
      },
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Updated District',
        color: null,
        baseRate: null,
        isActive: false,
      }),
    );
  });

  it('archives zone on delete without hard-deleting it', async () => {
    mockPrismaService.zone.findFirst.mockResolvedValue(baseZone);
    mockPrismaService.zone.update.mockResolvedValue({
      ...baseZone,
      is_active: false,
    });

    const result = await service.deleteZone('company-1', 'zone-1');

    expect(mockPrismaService.zone.update).toHaveBeenCalledWith({
      where: { id: 'zone-1' },
      data: { is_active: false },
      select: expect.any(Object),
    });
    expect(result.isActive).toBe(false);
  });
});
