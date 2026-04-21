import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneResponseDto } from './dto/zone-response.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin)
@RequirePermission('edit:zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOkResponse({ type: ZoneResponseDto, isArray: true })
  async listZones(
    @CurrentUser('companyId') companyId: string,
  ): Promise<ZoneResponseDto[]> {
    return await this.zonesService.listZones(companyId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ZoneResponseDto })
  async getZone(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) zoneId: string,
  ): Promise<ZoneResponseDto> {
    return await this.zonesService.getZone(companyId, zoneId);
  }

  @Post()
  @ApiCreatedResponse({ type: ZoneResponseDto })
  async createZone(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateZoneDto,
  ): Promise<ZoneResponseDto> {
    return await this.zonesService.createZone(companyId, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ZoneResponseDto })
  async updateZone(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) zoneId: string,
    @Body() dto: UpdateZoneDto,
  ): Promise<ZoneResponseDto> {
    return await this.zonesService.updateZone(companyId, zoneId, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ZoneResponseDto })
  async deleteZone(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) zoneId: string,
  ): Promise<ZoneResponseDto> {
    return await this.zonesService.deleteZone(companyId, zoneId);
  }
}
