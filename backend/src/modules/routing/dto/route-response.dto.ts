import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteStatus } from '@prisma/client';
import { RoutePointResponseDto } from './route-point-response.dto';
import { RoutingCoordinateDto } from './routing-coordinate.dto';

export class RouteResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiPropertyOptional({ nullable: true })
  courierId: string | null = null;

  @ApiProperty({ enum: RouteStatus })
  declare status: RouteStatus;

  @ApiProperty()
  declare version: number;

  @ApiProperty({ type: String, format: 'date-time' })
  declare routeDate: Date;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  totalDistanceMeters: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  totalDurationSeconds: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  provider: string | null = null;

  @ApiProperty({
    type: RoutingCoordinateDto,
    isArray: true,
  })
  polyline: RoutingCoordinateDto[] = [];

  @ApiProperty({
    type: RoutePointResponseDto,
    isArray: true,
  })
  routePoints: RoutePointResponseDto[] = [];

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  optimizationData: Record<string, unknown> | null = null;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  metadata: Record<string, unknown> | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
