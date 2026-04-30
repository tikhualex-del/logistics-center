import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import type { AuthenticatedPlatformAdmin } from '../auth/auth-request.types';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { CreatePlatformCompanyDto } from './dto/create-platform-company.dto';
import {
  ImpersonationSessionResponseDto,
  StartImpersonationResponseDto,
} from './dto/impersonation-response.dto';
import { ListImpersonationSessionsQueryDto } from './dto/list-impersonation-sessions.query.dto';
import { PlatformAdminResponseDto } from './dto/platform-admin-response.dto';
import { PlatformCompanyResponseDto } from './dto/platform-company-response.dto';
import { ProvisionOwnerDto } from './dto/provision-owner.dto';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { TenantUserViewDto } from './dto/tenant-user-view.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';
import { UpdatePlatformCompanyDto } from './dto/update-platform-company.dto';
import { PlatformGuard } from './guards/platform.guard';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@ApiBearerAuth('bearer')
@PlatformRoute()
@UseGuards(PlatformGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('companies')
  @ApiOkResponse({ type: PlatformCompanyResponseDto, isArray: true })
  async listCompanies(): Promise<PlatformCompanyResponseDto[]> {
    return await this.platformService.listCompanies();
  }

  @Post('companies')
  @ApiCreatedResponse({ type: PlatformCompanyResponseDto })
  async createCompany(
    @Body() dto: CreatePlatformCompanyDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.platformService.createCompany(dto, admin.id);
  }

  @Get('companies/:id')
  @ApiOkResponse({ type: PlatformCompanyResponseDto })
  async getCompany(
    @Param('id', new ParseUUIDPipe()) companyId: string,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.platformService.getCompany(companyId);
  }

  @Patch('companies/:id')
  @ApiOkResponse({ type: PlatformCompanyResponseDto })
  async updateCompany(
    @Param('id', new ParseUUIDPipe()) companyId: string,
    @Body() dto: UpdatePlatformCompanyDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.platformService.updateCompany(companyId, dto, admin.id);
  }

  @Patch('companies/:id/status')
  @ApiOkResponse({ type: PlatformCompanyResponseDto })
  async changeCompanyStatus(
    @Param('id', new ParseUUIDPipe()) companyId: string,
    @Body() dto: ChangeCompanyStatusDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.platformService.changeCompanyStatus(
      companyId,
      dto,
      admin.id,
    );
  }

  @Patch('companies/:id/archive')
  @ApiOkResponse({ type: PlatformCompanyResponseDto })
  async archiveCompany(
    @Param('id', new ParseUUIDPipe()) companyId: string,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.platformService.archiveCompany(companyId, admin.id);
  }

  @Post('companies/:id/seed-owner')
  @ApiCreatedResponse({ type: TenantUserViewDto })
  async seedOwner(
    @Param('id', new ParseUUIDPipe()) companyId: string,
    @Body() dto: ProvisionOwnerDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<TenantUserViewDto> {
    return await this.platformService.seedOwner(companyId, dto, admin.id);
  }

  @Get('companies/:id/users')
  @ApiOkResponse({ type: TenantUserViewDto, isArray: true })
  async listTenantUsers(
    @Param('id', new ParseUUIDPipe()) companyId: string,
  ): Promise<TenantUserViewDto[]> {
    return await this.platformService.listTenantUsers(companyId);
  }

  @Get('admins')
  @ApiOkResponse({ type: PlatformAdminResponseDto, isArray: true })
  async listAdmins(): Promise<PlatformAdminResponseDto[]> {
    return await this.platformService.listAdmins();
  }

  @Post('admins')
  @ApiCreatedResponse({ type: PlatformAdminResponseDto })
  async createAdmin(
    @Body() dto: CreatePlatformAdminDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformAdminResponseDto> {
    return await this.platformService.createAdmin(dto, admin.id);
  }

  @Get('admins/:id')
  @ApiOkResponse({ type: PlatformAdminResponseDto })
  async getAdmin(
    @Param('id', new ParseUUIDPipe()) adminId: string,
  ): Promise<PlatformAdminResponseDto> {
    return await this.platformService.getAdmin(adminId);
  }

  @Patch('admins/:id')
  @ApiOkResponse({ type: PlatformAdminResponseDto })
  async updateAdmin(
    @Param('id', new ParseUUIDPipe()) adminId: string,
    @Body() dto: UpdatePlatformAdminDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<PlatformAdminResponseDto> {
    return await this.platformService.updateAdmin(adminId, dto, admin.id);
  }

  @Post('impersonate/:companyId')
  @ApiCreatedResponse({ type: StartImpersonationResponseDto })
  async startImpersonation(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() dto: StartImpersonationDto,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<StartImpersonationResponseDto> {
    return await this.platformService.startImpersonation(
      companyId,
      dto,
      admin.id,
    );
  }

  @Post('impersonate/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Impersonation session ended' })
  async endImpersonation(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<{ message: string }> {
    await this.platformService.endImpersonation(sessionId, admin.id);
    return { message: 'Impersonation session ended' };
  }

  @Get('impersonate')
  @ApiOkResponse({ type: ImpersonationSessionResponseDto, isArray: true })
  async listImpersonationSessions(
    @Query() query: ListImpersonationSessionsQueryDto,
  ): Promise<ImpersonationSessionResponseDto[]> {
    return await this.platformService.listImpersonationSessions(
      query.companyId,
    );
  }
}
