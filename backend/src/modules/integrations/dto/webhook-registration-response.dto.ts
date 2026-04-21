import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_OUTBOUND_WEBHOOK_EVENTS } from '../integrations.constants';

export class WebhookRegistrationResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare name: string;

  @ApiProperty()
  declare provider: string;

  @ApiProperty()
  declare isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  outboundWebhookUrl: string | null = null;

  @ApiProperty()
  hasWebhookSecret = false;

  @ApiProperty()
  hasInboundSecret = false;

  @ApiProperty({
    enum: SUPPORTED_OUTBOUND_WEBHOOK_EVENTS,
    isArray: true,
  })
  eventTypes: string[] = [];

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  settings: Record<string, unknown> | null = null;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
