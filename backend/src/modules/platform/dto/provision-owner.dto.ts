import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ProvisionOwnerDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  @IsNotEmpty()
  declare email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, maxLength: 72 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  declare password: string;

  @ApiProperty({ example: 'Ivan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare firstName: string;

  @ApiPropertyOptional({ example: 'Petrov' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare lastName?: string;

  @ApiPropertyOptional({ example: '+79990000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  declare phone?: string;
}
