import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  IsGeoJsonPolygon,
  type GeoJsonPolygon,
} from '../validators/is-geo-json-polygon.decorator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Central District' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
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
  @IsObject()
  @IsGeoJsonPolygon()
  declare polygon: GeoJsonPolygon;

  @ApiPropertyOptional({ example: '#34C759', nullable: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'color must be a valid HEX color',
  })
  declare color?: string | null;

  @ApiPropertyOptional({ example: 250, nullable: true })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized === '' ? null : Number(normalized);
    }

    return value;
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'baseRate must be a valid number with up to 2 decimal places' },
  )
  @Min(0)
  declare baseRate?: number | null;
}
