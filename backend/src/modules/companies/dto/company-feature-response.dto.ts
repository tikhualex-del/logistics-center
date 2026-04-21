import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyFeatureResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare featureKey: string;

  @ApiProperty()
  declare enabled: boolean;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  config: Record<string, unknown> | null = null;

  @ApiPropertyOptional({ nullable: true })
  updatedByUserId: string | null = null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  enabledAt: Date | null = null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  disabledAt: Date | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
