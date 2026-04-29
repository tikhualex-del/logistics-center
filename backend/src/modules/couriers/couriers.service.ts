import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CourierStatus, Prisma, UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { DOMAIN_EVENTS } from '../../common/events.constants';
import { getTenantContextRequestId } from '../../prisma/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CourierLocationUpdatedEvent } from './couriers.events';
import { CourierResponseDto } from './dto/courier-response.dto';
import {
  CourierAvailabilityStatus,
  UpdateCourierStatusDto,
} from './dto/update-courier-status.dto';
import { UpdateCourierLocationDto } from './dto/update-courier-location.dto';

const courierSelect = {
  id: true,
  company_id: true,
  user_id: true,
  status: true,
  latitude: true,
  longitude: true,
  last_seen_at: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      first_name: true,
      last_name: true,
      is_active: true,
    },
  },
} satisfies Prisma.CourierSelect;

type CourierRecord = Prisma.CourierGetPayload<{ select: typeof courierSelect }>;

@Injectable()
export class CouriersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(CouriersService.name);
  }

  async listCouriers(companyId: string): Promise<CourierResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const couriers = await this.prisma.courier.findMany({
        orderBy: { created_at: 'desc' },
        select: courierSelect,
      });

      return couriers.map(mapCourier);
    });
  }

  async getCourier(
    companyId: string,
    courierId: string,
  ): Promise<CourierResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const courier = await this.prisma.courier.findFirst({
        where: { id: courierId },
        select: courierSelect,
      });

      if (!courier) {
        throw new NotFoundException('Courier not found');
      }

      return mapCourier(courier);
    });
  }

  async updateCourierStatus(
    companyId: string,
    courierId: string,
    dto: UpdateCourierStatusDto,
  ): Promise<CourierResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentCourier = await this.prisma.courier.findFirst({
        where: { id: courierId },
        select: courierSelect,
      });

      if (!currentCourier) {
        throw new NotFoundException('Courier not found');
      }

      if (!currentCourier.user.is_active) {
        throw new BadRequestException('Inactive courier cannot change status');
      }

      if (currentCourier.status === CourierStatus.inactive) {
        throw new BadRequestException(
          'Inactive courier profile cannot be toggled',
        );
      }

      if (currentCourier.status === CourierStatus.suspended) {
        throw new BadRequestException('Suspended courier cannot be toggled');
      }

      const nextStatus = mapAvailabilityStatus(dto.status);
      const updatedCourier = await this.prisma.courier.update({
        where: { id: courierId },
        data: {
          status: nextStatus,
          ...(dto.status === CourierAvailabilityStatus.online
            ? { last_seen_at: new Date() }
            : {}),
        },
        select: courierSelect,
      });

      this.logger.info(
        {
          courierId,
          companyId,
          status: updatedCourier.status,
        },
        'Courier status updated',
      );

      return mapCourier(updatedCourier);
    });
  }

  async updateCourierLocation(
    companyId: string,
    actorUserId: string,
    actorRole: UserRole,
    courierId: string,
    dto: UpdateCourierLocationDto,
  ): Promise<CourierResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const currentCourier = await this.prisma.courier.findFirst({
        where: { id: courierId },
        select: courierSelect,
      });

      if (!currentCourier) {
        throw new NotFoundException('Courier not found');
      }

      if (
        actorRole === UserRole.courier &&
        currentCourier.user_id !== actorUserId
      ) {
        throw new ForbiddenException(
          'Courier can update location only for their own profile',
        );
      }

      const updatedCourier = await this.prisma.courier.update({
        where: { id: courierId },
        data: {
          latitude: new Prisma.Decimal(dto.latitude),
          longitude: new Prisma.Decimal(dto.longitude),
          last_seen_at: new Date(),
        },
        select: courierSelect,
      });

      this.logger.info(
        {
          courierId,
          companyId,
          actorUserId,
          actorRole,
        },
        'Courier location updated',
      );

      const courier = mapCourier(updatedCourier);

      await this.emitCourierLocationUpdated({
        courierId,
        companyId,
        actorUserId,
        actorRole,
        requestId: getTenantContextRequestId() ?? null,
        latitude: courier.latitude ?? dto.latitude,
        longitude: courier.longitude ?? dto.longitude,
        lastSeenAt: courier.lastSeenAt,
        courier,
      });

      return courier;
    });
  }

  private async emitCourierLocationUpdated(
    payload: CourierLocationUpdatedEvent,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(
        DOMAIN_EVENTS.COURIER.LOCATION_UPDATED,
        payload,
      );
    } catch (error) {
      this.logger.warn(
        {
          courierId: payload.courierId,
          companyId: payload.companyId,
          actorUserId: payload.actorUserId,
          actorRole: payload.actorRole,
          error,
        },
        'Courier location-updated event emission failed',
      );
    }
  }
}

function mapCourier(courier: CourierRecord): CourierResponseDto {
  return {
    id: courier.id,
    companyId: courier.company_id,
    userId: courier.user_id,
    status: courier.status,
    isOnline: isOnlineStatus(courier.status),
    email: courier.user.email,
    phone: courier.user.phone,
    firstName: courier.user.first_name,
    lastName: courier.user.last_name,
    isActive: courier.user.is_active,
    latitude: decimalToNumber(courier.latitude),
    longitude: decimalToNumber(courier.longitude),
    lastSeenAt: courier.last_seen_at,
    createdAt: courier.created_at,
    updatedAt: courier.updated_at,
  };
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (!value) {
    return null;
  }

  return value.toNumber();
}

function mapAvailabilityStatus(
  value: CourierAvailabilityStatus,
): CourierStatus {
  return value === CourierAvailabilityStatus.online
    ? CourierStatus.available
    : CourierStatus.offline;
}

function isOnlineStatus(status: CourierStatus): boolean {
  return status === CourierStatus.available || status === CourierStatus.busy;
}
