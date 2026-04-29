import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BuildRouteDto } from './dto/build-route.dto';
import { ListRoutesQueryDto } from './dto/list-routes.query.dto';
import { RoutePreviewResponseDto } from './dto/route-preview-response.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutingService } from './routing.service';

@ApiTags('routes')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin, UserRole.dispatcher)
@Controller('routes')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('build')
  @RequirePermission('edit:routes')
  @ApiCreatedResponse({ type: RouteResponseDto })
  async buildRoute(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BuildRouteDto,
  ): Promise<RouteResponseDto> {
    return await this.routingService.buildRoute(companyId, userId, dto);
  }

  @Post('preview')
  @RequirePermission('edit:routes')
  @ApiCreatedResponse({ type: RoutePreviewResponseDto })
  async previewRoute(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: BuildRouteDto,
  ): Promise<RoutePreviewResponseDto> {
    return await this.routingService.previewRoute(companyId, dto);
  }

  @Get()
  @RequirePermission('edit:routes')
  @ApiOkResponse({ type: RouteResponseDto, isArray: true })
  async listRoutes(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ListRoutesQueryDto,
  ): Promise<RouteResponseDto[]> {
    return await this.routingService.listRoutes(companyId, query);
  }

  @Get(':id')
  @RequirePermission('edit:routes')
  @ApiOkResponse({ type: RouteResponseDto })
  async getRoute(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) routeId: string,
  ): Promise<RouteResponseDto> {
    return await this.routingService.getRoute(companyId, routeId);
  }

  @Patch(':id')
  @RequirePermission('edit:routes')
  @ApiOkResponse({ type: RouteResponseDto })
  async updateRoute(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) routeId: string,
    @Body() dto: UpdateRouteDto,
  ): Promise<RouteResponseDto> {
    return await this.routingService.updateRoute(
      companyId,
      userId,
      routeId,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermission('edit:routes')
  @ApiOkResponse({ type: RouteResponseDto })
  async deleteRoute(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) routeId: string,
  ): Promise<RouteResponseDto> {
    return await this.routingService.deleteRoute(companyId, userId, routeId);
  }
}
