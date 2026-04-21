import { AuditActorRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare companyId: string;

  @ApiProperty({ nullable: true })
  actorId: string | null = null;

  @ApiProperty({ enum: AuditActorRole, nullable: true })
  actorRole: AuditActorRole | null = null;

  @ApiProperty()
  declare action: string;

  @ApiProperty()
  declare entityType: string;

  @ApiProperty()
  declare entityId: string;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  before: Record<string, unknown> | null = null;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  after: Record<string, unknown> | null = null;

  @ApiProperty({ nullable: true })
  requestId: string | null = null;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  metadata: Record<string, unknown> | null = null;

  @ApiProperty()
  declare createdAt: Date;

  @ApiProperty()
  declare updatedAt: Date;
}
