import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty({ enum: UserRole })
  declare role: UserRole;

  @ApiProperty()
  declare email: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null = null;

  @ApiProperty()
  declare firstName: string;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null = null;

  @ApiProperty()
  declare isActive: boolean;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  lastLoginAt: Date | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
