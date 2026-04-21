import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUPPORTED_OUTBOUND_WEBHOOK_EVENTS } from '../integrations.constants';

export class UpdateWebhookRegistrationDto {
  @ApiPropertyOptional({ example: 'crm-main' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare name?: string;

  @ApiPropertyOptional({ example: 'amo-crm' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare provider?: string;

  @ApiPropertyOptional({
    example: 'https://crm.example.com/webhooks/logistics-center',
  })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  declare outboundWebhookUrl?: string;

  @ApiPropertyOptional({ example: 'super-secret-signing-key' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  declare webhookSecret?: string;

  @ApiPropertyOptional({ example: 'optional-inbound-secret' })
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  declare inboundSecret?: string;

  @ApiPropertyOptional({
    enum: SUPPORTED_OUTBOUND_WEBHOOK_EVENTS,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(SUPPORTED_OUTBOUND_WEBHOOK_EVENTS, { each: true })
  declare eventTypes?: string[];

  @ApiPropertyOptional()
  @Transform(({ value }) => normalizeOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  declare isActive?: boolean;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  declare settings?: Record<string, unknown>;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return value as string | undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value === true || value === 'true';
}
