import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyFeatureResponseDto } from './dto/company-feature-response.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpdateCompanyFeatureDto } from './dto/update-company-feature.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@ApiBearerAuth('bearer')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @ApiOkResponse({ type: CompanyResponseDto })
  async getCurrentCompany(
    @CurrentUser('companyId') companyId: string,
  ): Promise<CompanyResponseDto> {
    return await this.companiesService.getCurrentCompany(companyId);
  }

  @Patch('me')
  @Roles(UserRole.admin)
  @ApiOkResponse({ type: CompanyResponseDto })
  async updateCurrentCompany(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return await this.companiesService.updateCompany(companyId, dto);
  }

  @Get('me/features')
  @ApiOkResponse({ type: CompanyFeatureResponseDto, isArray: true })
  async listFeatureFlags(
    @CurrentUser('companyId') companyId: string,
  ): Promise<CompanyFeatureResponseDto[]> {
    return await this.companiesService.listFeatureFlags(companyId);
  }

  @Patch('me/features/:featureKey')
  @Roles(UserRole.admin)
  @ApiOkResponse({ type: CompanyFeatureResponseDto })
  async updateFeatureFlag(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('featureKey') featureKey: string,
    @Body() dto: UpdateCompanyFeatureDto,
  ): Promise<CompanyFeatureResponseDto> {
    return await this.companiesService.upsertFeatureFlag(
      companyId,
      featureKey,
      dto,
      userId,
    );
  }
}
