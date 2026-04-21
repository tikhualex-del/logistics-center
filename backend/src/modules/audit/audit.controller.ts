import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth('bearer')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.admin)
  @ApiOkResponse({ type: AuditLogResponseDto, isArray: true })
  async listAuditLogs(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<AuditLogResponseDto[]> {
    return await this.auditService.listAuditLogs(companyId, query);
  }
}
