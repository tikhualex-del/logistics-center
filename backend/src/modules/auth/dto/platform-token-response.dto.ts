import { ApiProperty } from '@nestjs/swagger';
import { PlatformAdminStatus } from '@prisma/client';

export class PlatformAuthAdminDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare email: string;

  @ApiProperty({ enum: PlatformAdminStatus })
  declare status: PlatformAdminStatus;
}

export class PlatformTokenResponseDto {
  @ApiProperty()
  declare accessToken: string;

  @ApiProperty({ type: PlatformAuthAdminDto })
  declare admin: PlatformAuthAdminDto;
}
