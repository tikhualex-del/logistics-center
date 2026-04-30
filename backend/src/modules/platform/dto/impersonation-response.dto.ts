import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartImpersonationResponseDto {
  @ApiProperty()
  declare accessToken: string;

  @ApiProperty()
  declare sessionId: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare expiresAt: Date;
}

export class ImpersonationSessionResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare superAdminId: string;

  @ApiProperty()
  declare targetCompanyId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare startedAt: Date;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  endedAt: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  reason: string | null = null;
}
