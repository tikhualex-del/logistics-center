import { UserRole } from '@prisma/client';
import { CourierResponseDto } from './dto/courier-response.dto';

export interface CourierLocationUpdatedEvent {
  courierId: string;
  companyId: string;
  actorUserId: string;
  actorRole: UserRole;
  requestId: string | null;
  latitude: number;
  longitude: number;
  lastSeenAt: Date | null;
  courier: CourierResponseDto;
}
