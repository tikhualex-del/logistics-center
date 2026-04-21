import { ApiPropertyOptional } from '@nestjs/swagger';
import { RouteStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

const ROUTE_TRANSPORT_MODES = ['driving', 'walking', 'cycling'] as const;

export class UpdateRouteDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Full order list for manual reorder/add/remove',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderIds?: string[];

  @ApiPropertyOptional({
    description: 'Reassign route courier',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID('4')
  courierId?: string | null;

  @ApiPropertyOptional({ enum: RouteStatus })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  routeDate?: Date;

  @ApiPropertyOptional({
    enum: ROUTE_TRANSPORT_MODES,
  })
  @IsOptional()
  @IsIn(ROUTE_TRANSPORT_MODES)
  mode?: (typeof ROUTE_TRANSPORT_MODES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  optimizeWaypoints?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  returnToStart?: boolean;

  @ApiPropertyOptional({
    description: 'Yandex locale like ru_RU or en_US',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsNotEmpty()
  locale?: string | null;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
