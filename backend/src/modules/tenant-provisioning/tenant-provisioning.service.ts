import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyStatus,
  PlatformAuditActorType,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProvisionTenantInput,
  ProvisionTenantOwnerInput,
} from './tenant-provisioning.types';

const BCRYPT_ROUNDS = 12;

const DEFAULT_FEATURE_FLAGS = [
  { featureKey: 'routing.yandex', enabled: true },
  { featureKey: 'integrations.crm', enabled: false },
  { featureKey: 'payments.minimum-guarantee', enabled: false },
  { featureKey: 'notifications.realtime', enabled: true },
  { featureKey: 'analytics.finance', enabled: false },
] as const;

const companySelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  timezone: true,
  default_currency: true,
  language: true,
  country: true,
  contact_email: true,
  contact_phone: true,
  plan_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.CompanySelect;

const ownerSelect = {
  id: true,
  company_id: true,
  role: true,
  email: true,
  first_name: true,
  last_name: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.UserSelect;

export type ProvisionedCompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;

export type ProvisionedOwnerRecord = Prisma.UserGetPayload<{
  select: typeof ownerSelect;
}>;

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantProvisioningService.name);
  }

  async provisionCompany(
    input: ProvisionTenantInput,
    actorAdminId: string,
  ): Promise<{
    company: ProvisionedCompanyRecord;
    owner: ProvisionedOwnerRecord;
  }> {
    const passwordHash = await bcrypt.hash(input.owner.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.runWithoutTenant(async () => {
        return await this.prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: {
              name: input.name,
              slug: input.slug,
              status: input.status ?? CompanyStatus.active,
              timezone: input.timezone ?? 'UTC',
              default_currency: input.defaultCurrency ?? 'RUB',
              language: input.language ?? 'ru',
              country: input.country ?? 'RU',
              contact_email: input.contactEmail ?? null,
              contact_phone: input.contactPhone ?? null,
              plan_id: input.planId ?? null,
            },
            select: companySelect,
          });

          const owner = await this.createOwner(tx, {
            companyId: company.id,
            owner: input.owner,
            passwordHash,
          });

          await this.seedDefaultFeatures(tx, company.id);

          await tx.platformAuditEvent.create({
            data: {
              actor_type: PlatformAuditActorType.super_admin,
              actor_id: actorAdminId,
              action: 'tenant.provisioned',
              target_type: 'company',
              target_id: company.id,
              company_id: company.id,
              metadata: {
                ownerUserId: owner.id,
                slug: company.slug,
              },
            },
          });

          this.logger.info(
            { companyId: company.id, ownerUserId: owner.id },
            'Tenant company provisioned',
          );

          return { company, owner };
        });
      });
    } catch (error) {
      if (isPrismaCode(error, 'P2002')) {
        throw new ConflictException(
          'Company slug or owner email already exists',
        );
      }

      throw error;
    }
  }

  async seedOwner(
    companyId: string,
    owner: ProvisionTenantOwnerInput,
    actorAdminId: string,
  ): Promise<ProvisionedOwnerRecord> {
    const passwordHash = await bcrypt.hash(owner.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.runWithoutTenant(async () => {
        return await this.prisma.$transaction(async (tx) => {
          const company = await tx.company.findUnique({
            where: { id: companyId },
            select: { id: true },
          });

          if (!company) {
            throw new NotFoundException('Company not found');
          }

          const activeUsers = await tx.user.count({
            where: {
              company_id: companyId,
              is_active: true,
            },
          });

          if (activeUsers > 0) {
            throw new ConflictException(
              'Company is already initialized; seed-owner is bootstrap-only',
            );
          }

          const createdOwner = await this.createOwner(tx, {
            companyId,
            owner,
            passwordHash,
          });

          await this.seedDefaultFeatures(tx, companyId);

          await tx.platformAuditEvent.create({
            data: {
              actor_type: PlatformAuditActorType.super_admin,
              actor_id: actorAdminId,
              action: 'tenant.owner.seeded',
              target_type: 'user',
              target_id: createdOwner.id,
              company_id: companyId,
            },
          });

          return createdOwner;
        });
      });
    } catch (error) {
      if (isPrismaCode(error, 'P2002')) {
        throw new ConflictException(
          'Email is already registered in this company',
        );
      }

      throw error;
    }
  }

  private async createOwner(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      owner: ProvisionTenantOwnerInput;
      passwordHash: string;
    },
  ): Promise<ProvisionedOwnerRecord> {
    return await tx.user.create({
      data: {
        company_id: input.companyId,
        role: UserRole.admin,
        email: input.owner.email,
        phone: input.owner.phone ?? null,
        first_name: input.owner.firstName,
        last_name: input.owner.lastName ?? null,
        password_hash: input.passwordHash,
        is_active: true,
      },
      select: ownerSelect,
    });
  }

  private async seedDefaultFeatures(
    tx: Prisma.TransactionClient,
    companyId: string,
  ): Promise<void> {
    const now = new Date();

    await tx.companyFeature.createMany({
      data: DEFAULT_FEATURE_FLAGS.map((feature) => ({
        company_id: companyId,
        feature_key: feature.featureKey,
        enabled: feature.enabled,
        enabled_at: feature.enabled ? now : null,
        disabled_at: feature.enabled ? null : now,
      })),
      skipDuplicates: true,
    });
  }
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
