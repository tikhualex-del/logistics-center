import { RouteStatus } from '@prisma/client';
import { RouteResponseDto } from './dto/route-response.dto';

export interface RouteBuiltEvent {
  routeId: string;
  companyId: string;
  actorUserId: string;
  requestId: string | null;
  route: RouteResponseDto;
}

export interface RouteUpdatedEvent {
  routeId: string;
  companyId: string;
  actorUserId: string;
  fromStatus: RouteStatus;
  toStatus: RouteStatus;
  requestId: string | null;
  route: RouteResponseDto;
}

export interface RouteCancelledEvent {
  routeId: string;
  companyId: string;
  actorUserId: string;
  fromStatus: RouteStatus;
  toStatus: 'cancelled';
  requestId: string | null;
  route: RouteResponseDto;
}
