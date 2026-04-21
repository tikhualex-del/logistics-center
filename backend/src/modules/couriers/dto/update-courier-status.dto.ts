import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum CourierAvailabilityStatus {
  online = 'online',
  offline = 'offline',
}

export class UpdateCourierStatusDto {
  @ApiProperty({ enum: CourierAvailabilityStatus })
  @IsEnum(CourierAvailabilityStatus)
  declare status: CourierAvailabilityStatus;
}
