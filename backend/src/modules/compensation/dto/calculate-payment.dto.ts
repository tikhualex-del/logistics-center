import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CalculatePaymentDto {
  @ApiProperty()
  @IsUUID()
  declare courierId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  declare periodStart: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  declare periodEnd: Date;

  @ApiPropertyOptional({ default: 'RUB' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string = 'RUB';
}
