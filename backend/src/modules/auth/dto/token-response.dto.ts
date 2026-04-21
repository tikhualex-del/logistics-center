import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare email: string;

  @ApiProperty()
  declare firstName: string;

  @ApiProperty({ required: false, nullable: true })
  lastName: string | null = null;

  @ApiProperty({ enum: UserRole })
  declare role: UserRole;

  @ApiProperty()
  declare companyId: string;
}

export class TokenResponseDto {
  @ApiProperty()
  declare accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  declare user: AuthUserDto;
}
