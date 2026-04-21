import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCourierLocationDto {
  @ApiProperty({ example: 55.7558 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value.trim()) : value,
  )
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'latitude must be a valid number' },
  )
  @Min(-90)
  @Max(90)
  declare latitude: number;

  @ApiProperty({ example: 37.6173 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value.trim()) : value,
  )
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 },
    { message: 'longitude must be a valid number' },
  )
  @Min(-180)
  @Max(180)
  declare longitude: number;
}
