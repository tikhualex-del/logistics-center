import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GeoJsonPolygon } from '../validators/is-geo-json-polygon.decorator';

export class ZoneResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare name: string;

  @ApiProperty({
    type: Object,
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [37.6173, 55.7558],
          [37.6273, 55.7558],
          [37.6273, 55.7658],
          [37.6173, 55.7558],
        ],
      ],
    },
  })
  declare polygon: GeoJsonPolygon;

  @ApiPropertyOptional({ nullable: true })
  color: string | null = null;

  @ApiPropertyOptional({ nullable: true, example: '250.00' })
  baseRate: string | null = null;

  @ApiProperty()
  declare isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
