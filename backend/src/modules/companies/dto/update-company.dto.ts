import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Fast Delivery LLC' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare name?: string;
}
