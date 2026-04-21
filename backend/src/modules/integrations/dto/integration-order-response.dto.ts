import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

const INBOUND_IMPORT_RESULT = ['created', 'existing'] as const;

export type InboundImportResult = (typeof INBOUND_IMPORT_RESULT)[number];

export class IntegrationOrderSnapshotDto {
  @ApiProperty()
  declare externalId: string;

  @ApiPropertyOptional({ nullable: true })
  orderNumber: string | null = null;

  @ApiProperty({ enum: OrderStatus })
  declare status: OrderStatus;

  @ApiProperty()
  declare deliveryAddress: string;

  @ApiPropertyOptional({ nullable: true })
  customerName: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  customerPhone: string | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  scheduledDate: Date | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  timeWindowFrom: Date | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  timeWindowTo: Date | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}

export class IntegrationOrderImportResponseDto {
  @ApiProperty()
  declare idempotencyKey: string;

  @ApiProperty()
  declare integrationName: string;

  @ApiProperty({ enum: INBOUND_IMPORT_RESULT })
  declare result: InboundImportResult;

  @ApiProperty({ type: () => IntegrationOrderSnapshotDto })
  declare order: IntegrationOrderSnapshotDto;
}
