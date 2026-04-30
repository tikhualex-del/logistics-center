import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DispatcherResponseDto } from './dto/dispatcher-response.dto';
import { DispatchersService } from './dispatchers.service';

@ApiTags('dispatchers')
@ApiBearerAuth('bearer')
@Controller('dispatchers')
export class DispatchersController {
  constructor(private readonly dispatchersService: DispatchersService) {}

  @Get()
  @Roles(UserRole.admin, UserRole.dispatcher)
  @RequirePermission('manage:couriers')
  @ApiOkResponse({ type: DispatcherResponseDto, isArray: true })
  async listDispatchers(
    @CurrentUser('companyId') companyId: string,
  ): Promise<DispatcherResponseDto[]> {
    return await this.dispatchersService.listDispatchers(companyId);
  }
}
