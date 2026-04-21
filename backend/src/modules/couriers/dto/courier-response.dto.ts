import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierStatus } from '@prisma/client';

export class CourierResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare userId: string;

  @ApiProperty({ enum: CourierStatus })
  declare status: CourierStatus;

  @ApiProperty()
  declare isOnline: boolean;

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

  @ApiPropertyOptional({ nullable: true })
  latitude: number | null = null;

  @ApiPropertyOptional({ nullable: true })
  longitude: number | null = null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSeenAt: Date | null = null;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
