import { ApiProperty } from '@nestjs/swagger';
import { PlatformAdminStatus } from '@prisma/client';

export class PlatformAdminResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare email: string;

  @ApiProperty({ enum: PlatformAdminStatus })
  declare status: PlatformAdminStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
