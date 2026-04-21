import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRuleType } from '@prisma/client';

export class PaymentRuleResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare ruleKey: string;

  @ApiProperty()
  declare name: string;

  @ApiProperty({ enum: PaymentRuleType })
  declare ruleType: PaymentRuleType;

  @ApiProperty()
  declare version: number;

  @ApiProperty()
  declare value: number;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  conditions: Record<string, unknown> | null = null;

  @ApiProperty()
  declare isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  effectiveFrom: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo: Date | null = null;

  @ApiPropertyOptional({ nullable: true })
  changedByUserId: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  changeReason: string | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
