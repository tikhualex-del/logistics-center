import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SLUG_PATTERN } from '../../../common/utils/slug';
import { ProvisionOwnerDto } from './provision-owner.dto';

export class CreatePlatformCompanyDto {
  @ApiProperty({ example: 'Fast Delivery LLC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare name: string;

  @ApiProperty({ example: 'fast-delivery' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(SLUG_PATTERN)
  declare slug: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow', default: 'UTC' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare timezone?: string;

  @ApiPropertyOptional({ example: 'RUB', default: 'RUB' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  declare defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'ru', default: 'ru' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  declare language?: string;

  @ApiPropertyOptional({ example: 'RU', default: 'RU' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  declare country?: string;

  @ApiPropertyOptional({ example: 'ops@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  declare contactEmail?: string;

  @ApiPropertyOptional({ example: '+79990000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  declare contactPhone?: string;

  @ApiPropertyOptional({ example: 'starter' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare planId?: string;

  @ApiProperty({ type: ProvisionOwnerDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ProvisionOwnerDto)
  declare owner: ProvisionOwnerDto;
}
