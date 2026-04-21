import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateCompanyFeatureDto {
  @ApiProperty()
  @IsBoolean()
  declare enabled: boolean;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  declare config?: Record<string, unknown>;
}
