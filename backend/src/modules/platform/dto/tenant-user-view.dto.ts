import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class TenantUserViewDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare email: string;

  @ApiProperty()
  declare firstName: string;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null = null;

  @ApiProperty({ enum: UserRole })
  declare role: UserRole;

  @ApiProperty()
  declare isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;
}
