import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
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

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'crm-order-123' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare externalId?: string;

  @ApiPropertyOptional({ example: 'ORD-2026-0001' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare orderNumber?: string;

  @ApiPropertyOptional({ example: 'Ivan Petrov' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  declare customerName?: string;

  @ApiPropertyOptional({ example: '+79990000000' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsPhoneNumber('RU')
  declare customerPhone?: string;

  @ApiProperty({ example: 'Moscow, Tverskaya 1' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  declare deliveryAddress: string;

  @ApiPropertyOptional({ example: 55.7558, nullable: true })
  @Transform(({ value }) => normalizeOptionalNumber(value))
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'deliveryLatitude must be a valid number' },
  )
  @Min(-90)
  @Max(90)
  declare deliveryLatitude?: number | null;

  @ApiPropertyOptional({ example: 37.6173, nullable: true })
  @Transform(({ value }) => normalizeOptionalNumber(value))
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'deliveryLongitude must be a valid number' },
  )
  @Min(-180)
  @Max(180)
  declare deliveryLongitude?: number | null;

  @ApiPropertyOptional({ example: 'Leave at reception' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare comment?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeOptionalDate(value))
  @Type(() => Date)
  @IsOptional()
  declare scheduledDate?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeOptionalDate(value))
  @Type(() => Date)
  @IsOptional()
  declare timeWindowFrom?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Transform(({ value }) => normalizeOptionalDate(value))
  @Type(() => Date)
  @IsOptional()
  declare timeWindowTo?: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsUUID()
  declare zoneId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsUUID()
  declare assignedCourierId?: string;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return value as string | undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized === '' ? undefined : Number(normalized);
  }

  return value as number;
}

function normalizeOptionalDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(stringifyUnknown(value));
}
