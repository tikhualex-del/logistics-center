import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutingCoordinateDto } from './routing-coordinate.dto';

export class RoutePreviewResponseDto {
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
}
