import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty({ enum: OrderStatus })
  declare status: OrderStatus;

  @ApiPropertyOptional({ nullable: true })
  externalId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  orderNumber: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  customerName: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  customerPhone: string | null = null;

  @ApiProperty()
  declare deliveryAddress: string;

  @ApiPropertyOptional({ nullable: true })
  deliveryLatitude: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  deliveryLongitude: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  comment: string | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  scheduledDate: Date | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  timeWindowFrom: Date | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  timeWindowTo: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  zoneId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  assignedCourierId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  assignedByUserId: string | null = null;

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
