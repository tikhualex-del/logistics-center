import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  declare status?: OrderStatus;

  @ApiPropertyOptional({
    example: '2026-04-16',
    description: 'Filter by scheduled date (UTC day)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsDateString()
  declare date?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUUID()
  declare zoneId?: string;

  @ApiPropertyOptional({
    example: 'Ivan',
    description:
      'Search by external id, order number, customer name, customer phone, or delivery address',
  })
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptionalQueryString(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(150)
  declare search?: string;

  @ApiPropertyOptional({
    example: '09:00',
    description:
      'Delivery window filter start. Accepts HH:mm with date, or full date-time.',
  })
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptionalQueryString(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(40)
  declare timeWindowFrom?: string;

  @ApiPropertyOptional({
    example: '13:00',
    description:
      'Delivery window filter end. Accepts HH:mm with date, or full date-time.',
  })
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptionalQueryString(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(40)
  declare timeWindowTo?: string;
}

function normalizeOptionalQueryString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return value as string | undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}
