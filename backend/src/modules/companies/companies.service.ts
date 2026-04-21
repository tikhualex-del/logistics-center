import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyFeatureResponseDto } from './dto/company-feature-response.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpdateCompanyFeatureDto } from './dto/update-company-feature.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { normalizeFeatureKey } from './feature-key';

const JSON_NULL = Prisma.JsonNull;

const companySelect = {
  id: true,
  name: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.CompanySelect;

const companyFeatureSelect = {
  id: true,
  company_id: true,
  feature_key: true,
  enabled: true,
  config: true,
  updated_by_user_id: true,
  enabled_at: true,
  disabled_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.CompanyFeatureSelect;

type CompanyRecord = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;
type CompanyFeatureRecord = Prisma.CompanyFeatureGetPayload<{
  select: typeof companyFeatureSelect;
}>;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CompaniesService.name);
  }

  async createCompany(name: string): Promise<CompanyResponseDto> {
    return await this.prisma.runWithoutTenant(async () => {
      const company = await this.prisma.company.create({
        data: { name },
        select: companySelect,
      });

      this.logger.info({ companyId: company.id }, 'Company created');
      return mapCompany(company);
    });
  }

  async getCurrentCompany(companyId: string): Promise<CompanyResponseDto> {
    return await this.prisma.runWithoutTenant(async () => {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: companySelect,
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return mapCompany(company);
    });
  }

  async updateCompany(
    companyId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return await this.prisma.runWithoutTenant(async () => {
      const existing = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Company not found');
      }

      const company = await this.prisma.company.update({
        where: { id: companyId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
        },
        select: companySelect,
      });

      this.logger.info({ companyId }, 'Company updated');
      return mapCompany(company);
    });
  }

  async listFeatureFlags(companyId: string): Promise<CompanyFeatureResponseDto[]> {
    await this.ensureCompanyExists(companyId);

    return await this.prisma.runWithTenant(companyId, async () => {
      const featureFlags = await this.prisma.companyFeature.findMany({
        orderBy: { feature_key: 'asc' },
        select: companyFeatureSelect,
      });

      return featureFlags.map(mapCompanyFeature);
    });
  }

  async upsertFeatureFlag(
    companyId: string,
    featureKey: string,
    dto: UpdateCompanyFeatureDto,
    updatedByUserId: string,
  ): Promise<CompanyFeatureResponseDto> {
    await this.ensureCompanyExists(companyId);

    const normalizedFeatureKey = normalizeFeatureKey(featureKey);

    return await this.prisma.runWithTenant(companyId, async () => {
      const existing = await this.prisma.companyFeature.findFirst({
        where: { feature_key: normalizedFeatureKey },
        select: {
          id: true,
          enabled: true,
          enabled_at: true,
          disabled_at: true,
        },
      });

      const now = new Date();
      const configValue =
        dto.config === undefined
          ? JSON_NULL
          : (dto.config as Prisma.InputJsonValue);

      const featureFlag = existing
        ? await this.prisma.companyFeature.update({
            where: { id: existing.id },
            data: {
              enabled: dto.enabled,
              updated_by_user_id: updatedByUserId,
              ...(dto.config !== undefined ? { config: configValue } : {}),
              ...(existing.enabled !== dto.enabled
                ? dto.enabled
                  ? {
                      enabled_at: now,
                      disabled_at: null,
                    }
                  : {
                      disabled_at: now,
                    }
                : {}),
            },
            select: companyFeatureSelect,
          })
        : await this.prisma.companyFeature.create({
            data: {
              company_id: companyId,
              feature_key: normalizedFeatureKey,
              enabled: dto.enabled,
              config: configValue,
              updated_by_user_id: updatedByUserId,
              enabled_at: dto.enabled ? now : null,
              disabled_at: dto.enabled ? null : now,
            },
            select: companyFeatureSelect,
          });

      this.logger.info(
        {
          companyId,
          featureKey: normalizedFeatureKey,
          enabled: featureFlag.enabled,
          updatedByUserId,
        },
        'Company feature flag upserted',
      );

      return mapCompanyFeature(featureFlag);
    });
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.runWithoutTenant(async () => {
      return this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }
}

function mapCompany(company: CompanyRecord): CompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  };
}

function mapCompanyFeature(
  featureFlag: CompanyFeatureRecord,
): CompanyFeatureResponseDto {
  return {
    id: featureFlag.id,
    companyId: featureFlag.company_id,
    featureKey: featureFlag.feature_key,
    enabled: featureFlag.enabled,
    config: isPlainObject(featureFlag.config)
      ? (featureFlag.config as Record<string, unknown>)
      : null,
    updatedByUserId: featureFlag.updated_by_user_id,
    enabledAt: featureFlag.enabled_at,
    disabledAt: featureFlag.disabled_at,
    createdAt: featureFlag.created_at,
    updatedAt: featureFlag.updated_at,
  };
}

function isPlainObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
