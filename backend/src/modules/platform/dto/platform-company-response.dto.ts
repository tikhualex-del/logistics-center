import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';

export class PlatformCompanyResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare name: string;

  @ApiProperty()
  declare slug: string;

  @ApiProperty({ enum: CompanyStatus })
  declare status: CompanyStatus;

  @ApiProperty()
  declare timezone: string;

  @ApiProperty()
  declare defaultCurrency: string;

  @ApiProperty()
  declare language: string;

  @ApiProperty()
  declare country: string;

  @ApiPropertyOptional({ nullable: true })
  contactEmail: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  contactPhone: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  planId: string | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
