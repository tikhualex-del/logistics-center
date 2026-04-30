import { ApiProperty } from '@nestjs/swagger';
import { PlatformAdminStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePlatformAdminDto {
  @ApiProperty({ enum: PlatformAdminStatus })
  @IsEnum(PlatformAdminStatus)
  declare status: PlatformAdminStatus;
}
