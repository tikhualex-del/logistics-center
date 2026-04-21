import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare courierId: string;

  @ApiPropertyOptional({ nullable: true })
  paymentRuleVersionId: string | null = null;

  @ApiProperty({ enum: PaymentStatus })
  declare status: PaymentStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  declare periodStart: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare periodEnd: Date;

  @ApiProperty()
  declare currency: string;

  @ApiProperty({ example: '1250.50' })
  declare amount: string;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
  })
  declare breakdown: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  approvedByUserId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  approvedAt: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null = null;

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
