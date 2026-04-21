import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateZoneDto } from './create-zone.dto';

describe('CreateZoneDto', () => {
  it('accepts valid GeoJSON polygon payload', async () => {
    const dto = plainToInstance(
      CreateZoneDto,
      {
        name: 'Central District',
        polygon: {
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
        color: '#34C759',
        baseRate: '250',
      },
      { enableImplicitConversion: true },
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects polygon with unclosed ring', async () => {
    const dto = plainToInstance(CreateZoneDto, {
      name: 'Broken District',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [37.6173, 55.7558],
            [37.6273, 55.7558],
            [37.6273, 55.7658],
            [37.6173, 55.7658],
          ],
        ],
      },
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints).toMatchObject({
      isGeoJsonPolygon: 'polygon must be a valid GeoJSON Polygon',
    });
  });
});
