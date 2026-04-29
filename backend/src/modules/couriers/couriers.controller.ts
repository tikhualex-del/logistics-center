import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CourierResponseDto } from './dto/courier-response.dto';
import { UpdateCourierLocationDto } from './dto/update-courier-location.dto';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';
import { CouriersService } from './couriers.service';

@ApiTags('couriers')
@ApiBearerAuth('bearer')
@Controller('couriers')
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get()
  @Roles(UserRole.admin, UserRole.dispatcher)
  @RequirePermission('manage:couriers')
  @ApiOkResponse({ type: CourierResponseDto, isArray: true })
  async listCouriers(
    @CurrentUser('companyId') companyId: string,
  ): Promise<CourierResponseDto[]> {
    return await this.couriersService.listCouriers(companyId);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.dispatcher)
  @RequirePermission('manage:couriers')
  @ApiOkResponse({ type: CourierResponseDto })
  async getCourier(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) courierId: string,
  ): Promise<CourierResponseDto> {
    return await this.couriersService.getCourier(companyId, courierId);
  }

  @Patch(':id/status')
  @Roles(UserRole.admin, UserRole.dispatcher)
  @RequirePermission('manage:couriers')
  @ApiOkResponse({ type: CourierResponseDto })
  async updateCourierStatus(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) courierId: string,
    @Body() dto: UpdateCourierStatusDto,
  ): Promise<CourierResponseDto> {
    return await this.couriersService.updateCourierStatus(
      companyId,
      courierId,
      dto,
    );
  }

  @Patch(':id/location')
  @Roles(UserRole.admin, UserRole.dispatcher, UserRole.courier)
  @ApiOkResponse({ type: CourierResponseDto })
  async updateCourierLocation(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') actorUserId: string,
    @CurrentUser('role') actorRole: UserRole,
    @Param('id', new ParseUUIDPipe()) courierId: string,
    @Body() dto: UpdateCourierLocationDto,
  ): Promise<CourierResponseDto> {
    return await this.couriersService.updateCourierLocation(
      companyId,
      actorUserId,
      actorRole,
      courierId,
      dto,
    );
  }
}
