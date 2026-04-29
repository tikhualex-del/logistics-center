import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { stringifyUnknown } from '../../../common/utils/stringify-unknown';

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'crm-order-123', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare externalId?: string | null;

  @ApiPropertyOptional({ example: 'ORD-2026-0001', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare orderNumber?: string | null;

  @ApiPropertyOptional({ example: 'Ivan Petrov', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  declare customerName?: string | null;

  @ApiPropertyOptional({ example: '+79990000000', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsPhoneNumber('RU')
  declare customerPhone?: string | null;

  @ApiPropertyOptional({ example: 'Moscow, Tverskaya 1' })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare deliveryAddress?: string;

  @ApiPropertyOptional({ example: 55.7558, nullable: true })
  @Transform(({ value }) => normalizeNullableNumber(value))
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'deliveryLatitude must be a valid number' },
  )
  @Min(-90)
  @Max(90)
  declare deliveryLatitude?: number | null;

  @ApiPropertyOptional({ example: 37.6173, nullable: true })
  @Transform(({ value }) => normalizeNullableNumber(value))
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'deliveryLongitude must be a valid number' },
  )
  @Min(-180)
  @Max(180)
  declare deliveryLongitude?: number | null;

  @ApiPropertyOptional({ example: 'Leave at reception', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare comment?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeNullableDate(value))
  @Type(() => Date)
  @IsOptional()
  declare scheduledDate?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeNullableDate(value))
  @Type(() => Date)
  @IsOptional()
  declare timeWindowFrom?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeNullableDate(value))
  @Type(() => Date)
  @IsOptional()
  declare timeWindowTo?: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsUUID()
  declare zoneId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @Transform(({ value }) => normalizeNullableString(value))
  @IsOptional()
  @IsUUID()
  declare assignedCourierId?: string | null;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @Transform(({ value }) => normalizeNullableObject(value))
  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown> | null;
}

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value as string | undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

function normalizeNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized === '' ? null : Number(normalized);
  }

  return value as number;
}

function normalizeNullableDate(value: unknown): Date | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(stringifyUnknown(value));
}

function normalizeNullableObject(
  value: unknown,
): Record<string, unknown> | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined || value === '') {
    return undefined;
  }

  return value as Record<string, unknown>;
}
