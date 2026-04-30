import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlatformAdminDto {
  @ApiProperty({ example: 'platform-admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  declare email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, maxLength: 72 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  declare password: string;
}
