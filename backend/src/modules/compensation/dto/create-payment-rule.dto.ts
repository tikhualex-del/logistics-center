import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRuleType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentRuleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  declare name: string;

  @ApiProperty({ enum: PaymentRuleType })
  @IsEnum(PaymentRuleType)
  declare ruleType: PaymentRuleType;

  @ApiProperty({
    description: 'Numeric rule value applied by the compensation engine',
    example: 250,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  declare value: number;

  @ApiPropertyOptional({
    description: 'Type-specific conditions stored inside rule config JSON',
    type: Object,
    additionalProperties: true,
    nullable: true,
    example: { zoneId: 'zone-1' },
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date | null;
}
