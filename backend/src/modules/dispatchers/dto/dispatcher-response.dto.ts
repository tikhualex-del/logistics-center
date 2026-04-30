import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DispatcherResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty()
  declare userId: string;

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

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  declare updatedAt: Date;
}
