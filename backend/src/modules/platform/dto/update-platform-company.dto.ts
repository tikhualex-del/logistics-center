import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePlatformCompanyDto {
  @ApiPropertyOptional({ example: 'Fast Delivery LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  declare name?: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare timezone?: string;

  @ApiPropertyOptional({ example: 'RUB' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  declare defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'ru' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  declare language?: string;

  @ApiPropertyOptional({ example: 'RU' })
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

  @ApiPropertyOptional({ example: 'business' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare planId?: string;
}
