import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class RoutePointResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare routeId: string;

  @ApiProperty()
  declare orderId: string;

  @ApiProperty()
  declare sequence: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  plannedEta: Date | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  actualEta: Date | null = null;

  @ApiProperty()
  declare deliveryAddress: string;

  @ApiPropertyOptional({ nullable: true })
  deliveryLatitude: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  deliveryLongitude: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  customerName: string | null = null;

  @ApiProperty({ enum: OrderStatus })
  declare orderStatus: OrderStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  scheduledDate: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  zoneId: string | null = null;
}
