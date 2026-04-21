import { Test, type TestingModule } from '@nestjs/testing';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import type { GeoJsonPolygon } from './validators/is-geo-json-polygon.decorator';

const mockZonesService = {
  listZones: jest.fn(),
  getZone: jest.fn(),
  createZone: jest.fn(),
  updateZone: jest.fn(),
  deleteZone: jest.fn(),
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

const zoneResponse = {
  id: 'zone-1',
  companyId: 'company-1',
  name: 'Central District',
  polygon: zonePolygon,
  color: '#34C759',
  baseRate: '250.00',
  isActive: true,
  createdAt: new Date('2026-04-16T10:00:00.000Z'),
  updatedAt: new Date('2026-04-16T10:00:00.000Z'),
};

describe('ZonesController', () => {
  let controller: ZonesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZonesController],
      providers: [{ provide: ZonesService, useValue: mockZonesService }],
    }).compile();

    controller = module.get<ZonesController>(ZonesController);
  });

  it('lists tenant zones', async () => {
    mockZonesService.listZones.mockResolvedValue([zoneResponse]);

    await expect(controller.listZones('company-1')).resolves.toEqual([
      zoneResponse,
    ]);
    expect(mockZonesService.listZones).toHaveBeenCalledWith('company-1');
  });

  it('returns a single tenant zone', async () => {
    mockZonesService.getZone.mockResolvedValue(zoneResponse);

    await expect(controller.getZone('company-1', 'zone-1')).resolves.toEqual(
      zoneResponse,
    );
    expect(mockZonesService.getZone).toHaveBeenCalledWith('company-1', 'zone-1');
  });

  it('creates a zone inside tenant scope', async () => {
    const dto = {
      name: 'Central District',
      polygon: zoneResponse.polygon,
      color: '#34C759',
      baseRate: 250,
    };
    mockZonesService.createZone.mockResolvedValue(zoneResponse);

    await expect(controller.createZone('company-1', dto)).resolves.toEqual(
      zoneResponse,
    );
    expect(mockZonesService.createZone).toHaveBeenCalledWith('company-1', dto);
  });

  it('updates a zone inside tenant scope', async () => {
    const dto = {
      name: 'North District',
      color: '#FF9500',
      baseRate: 280,
      isActive: true,
    };
    const updatedZone = { ...zoneResponse, name: dto.name, color: dto.color };
    mockZonesService.updateZone.mockResolvedValue(updatedZone);

    await expect(
      controller.updateZone('company-1', 'zone-1', dto),
    ).resolves.toEqual(updatedZone);
    expect(mockZonesService.updateZone).toHaveBeenCalledWith(
      'company-1',
      'zone-1',
      dto,
    );
  });

  it('soft-deletes a zone inside tenant scope', async () => {
    const deletedZone = { ...zoneResponse, isActive: false };
    mockZonesService.deleteZone.mockResolvedValue(deletedZone);

    await expect(controller.deleteZone('company-1', 'zone-1')).resolves.toEqual(
      deletedZone,
    );
    expect(mockZonesService.deleteZone).toHaveBeenCalledWith(
      'company-1',
      'zone-1',
    );
  });
});
