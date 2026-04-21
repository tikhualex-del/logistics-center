import { ApiProperty } from '@nestjs/swagger';

export class RoutingCoordinateDto {
  @ApiProperty()
  declare latitude: number;

  @ApiProperty()
  declare longitude: number;
}
