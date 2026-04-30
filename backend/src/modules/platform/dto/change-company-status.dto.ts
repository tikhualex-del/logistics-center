import { ApiProperty } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangeCompanyStatusDto {
  @ApiProperty({ enum: CompanyStatus })
  @IsEnum(CompanyStatus)
  declare status: CompanyStatus;
}
