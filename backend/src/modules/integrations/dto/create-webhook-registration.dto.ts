import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { stringifyUnknown } from '../../../common/utils/stringify-unknown';
import { SUPPORTED_OUTBOUND_WEBHOOK_EVENTS } from '../integrations.constants';

export class CreateWebhookRegistrationDto {
  @ApiProperty({ example: 'crm-main' })
  @Transform(({ value }) => normalizeRequiredString(value))
  @IsString()
  @MaxLength(120)
  declare name: string;

  @ApiProperty({ example: 'amo-crm' })
  @Transform(({ value }) => normalizeRequiredString(value))
  @IsString()
  @MaxLength(80)
  declare provider: string;

  @ApiProperty({ example: 'https://crm.example.com/webhooks/logistics-center' })
  @Transform(({ value }) => normalizeRequiredString(value))
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  declare outboundWebhookUrl: string;

  @ApiProperty({ example: 'super-secret-signing-key' })
  @Transform(({ value }) => normalizeRequiredString(value))
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  declare webhookSecret: string;

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
    description:
      'If omitted, the integration receives all supported outbound events',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(SUPPORTED_OUTBOUND_WEBHOOK_EVENTS, { each: true })
  declare eventTypes?: string[];

  @ApiPropertyOptional({ default: true })
  @Transform(({ value }) => normalizeOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  declare settings?: Record<string, unknown>;
}

function normalizeRequiredString(value: unknown): string {
  if (typeof value !== 'string') {
    return stringifyUnknown(value);
  }

  return value.trim();
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
