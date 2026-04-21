import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneResponseDto } from './dto/zone-response.dto';
import type { GeoJsonPolygon } from './validators/is-geo-json-polygon.decorator';

const zoneSelect = {
  id: true,
  company_id: true,
  name: true,
  polygon: true,
  color: true,
  base_rate: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ZoneSelect;

type ZoneRecord = Prisma.ZoneGetPayload<{ select: typeof zoneSelect }>;

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ZonesService.name);
  }

  async listZones(companyId: string): Promise<ZoneResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const zones = await this.prisma.zone.findMany({
        where: { is_active: true },
        orderBy: [{ created_at: 'desc' }],
        select: zoneSelect,
      });

      return zones.map(mapZone);
    });
  }

  async getZone(companyId: string, zoneId: string): Promise<ZoneResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const zone = await this.prisma.zone.findFirst({
        where: {
          id: zoneId,
          is_active: true,
        },
        select: zoneSelect,
      });

      if (!zone) {
        throw new NotFoundException('Zone not found');
      }

      return mapZone(zone);
    });
  }

  async createZone(
    companyId: string,
    dto: CreateZoneDto,
  ): Promise<ZoneResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const existing = await this.prisma.zone.findFirst({
        where: { name: dto.name },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'Zone with this name already exists in this company',
        );
      }

      const zone = await this.prisma.zone.create({
        data: {
          company_id: companyId,
          name: dto.name,
          polygon: dto.polygon as Prisma.InputJsonValue,
          color: dto.color ?? null,
          base_rate: toDecimal(dto.baseRate),
        },
        select: zoneSelect,
      });

      this.logger.info(
        {
          zoneId: zone.id,
          companyId,
        },
        'Zone created',
      );

      return mapZone(zone);
    });
  }

  async updateZone(
    companyId: string,
    zoneId: string,
    dto: UpdateZoneDto,
  ): Promise<ZoneResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentZone = await this.prisma.zone.findFirst({
        where: {
          id: zoneId,
          is_active: true,
        },
        select: zoneSelect,
      });

      if (!currentZone) {
        throw new NotFoundException('Zone not found');
      }

      if (dto.name && dto.name !== currentZone.name) {
        const existing = await this.prisma.zone.findFirst({
          where: {
            name: dto.name,
            id: { not: zoneId },
          },
          select: { id: true },
        });

        if (existing) {
          throw new ConflictException(
            'Zone with this name already exists in this company',
          );
        }
      }

      const data: Prisma.ZoneUpdateInput = {};

      if (dto.name !== undefined) {
        data.name = dto.name;
      }

      if (dto.polygon !== undefined) {
        data.polygon = dto.polygon as Prisma.InputJsonValue;
      }

      if (dto.color !== undefined) {
        data.color = dto.color ?? null;
      }

      if (dto.baseRate !== undefined) {
        data.base_rate = toDecimal(dto.baseRate);
      }

      if (dto.isActive !== undefined) {
        data.is_active = dto.isActive;
      }

      const zone = await this.prisma.zone.update({
        where: { id: zoneId },
        data,
        select: zoneSelect,
      });

      this.logger.info(
        {
          zoneId,
          companyId,
        },
        'Zone updated',
      );

      return mapZone(zone);
    });
  }

  async deleteZone(companyId: string, zoneId: string): Promise<ZoneResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentZone = await this.prisma.zone.findFirst({
        where: { id: zoneId },
        select: zoneSelect,
      });

      if (!currentZone) {
        throw new NotFoundException('Zone not found');
      }

      if (!currentZone.is_active) {
        return mapZone(currentZone);
      }

      const zone = await this.prisma.zone.update({
        where: { id: zoneId },
        data: { is_active: false },
        select: zoneSelect,
      });

      this.logger.info(
        {
          zoneId,
          companyId,
        },
        'Zone archived',
      );

      return mapZone(zone);
    });
  }
}

function mapZone(zone: ZoneRecord): ZoneResponseDto {
  return {
    id: zone.id,
    companyId: zone.company_id,
    name: zone.name,
    polygon: zone.polygon as GeoJsonPolygon,
    color: zone.color,
    baseRate: formatBaseRate(zone.base_rate),
    isActive: zone.is_active,
    createdAt: zone.created_at,
    updatedAt: zone.updated_at,
  };
}

function toDecimal(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
}

function formatBaseRate(value: Prisma.Decimal | null): string | null {
  if (!value) {
    return null;
  }

  return value.toFixed(2);
}
