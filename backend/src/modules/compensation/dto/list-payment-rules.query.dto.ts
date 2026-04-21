import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRuleType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

export class ListPaymentRulesQueryDto {
  @ApiPropertyOptional({ enum: PaymentRuleType })
  @IsOptional()
  @IsEnum(PaymentRuleType)
  ruleType?: PaymentRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruleKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'When true, returns all versions instead of only the latest one',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeHistory?: boolean = false;

  @ApiPropertyOptional({
    description: 'When true, includes inactive rules in the list',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeInactive?: boolean = false;
}
