import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

const ROUTE_TRANSPORT_MODES = ['driving', 'walking', 'cycling'] as const;

export class BuildRouteDto {
  @ApiProperty({
    type: [String],
    description: 'Orders to include in the route',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  declare orderIds: string[];

  @ApiPropertyOptional({
    description: 'Assigned courier for route start point',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID('4')
  courierId?: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  declare routeDate: Date;

  @ApiPropertyOptional({
    enum: ROUTE_TRANSPORT_MODES,
    default: 'driving',
  })
  @IsOptional()
  @IsIn(ROUTE_TRANSPORT_MODES)
  mode?: (typeof ROUTE_TRANSPORT_MODES)[number];

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  optimizeWaypoints?: boolean;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  returnToStart?: boolean;

  @ApiPropertyOptional({
    description: 'Yandex locale like ru_RU or en_US',
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
