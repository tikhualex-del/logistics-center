import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyStatus,
  PlatformAdminStatus,
  PlatformAuditActorType,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TenantProvisioningService } from '../tenant-provisioning/tenant-provisioning.service';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { CreatePlatformCompanyDto } from './dto/create-platform-company.dto';
import {
  ImpersonationSessionResponseDto,
  StartImpersonationResponseDto,
} from './dto/impersonation-response.dto';
import { PlatformAdminResponseDto } from './dto/platform-admin-response.dto';
import { PlatformCompanyResponseDto } from './dto/platform-company-response.dto';
import { ProvisionOwnerDto } from './dto/provision-owner.dto';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { TenantUserViewDto } from './dto/tenant-user-view.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';
import { UpdatePlatformCompanyDto } from './dto/update-platform-company.dto';

const BCRYPT_ROUNDS = 12;

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

const platformAdminSelect = {
  id: true,
  email: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PlatformSuperAdminSelect;

const tenantUserSelect = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.UserSelect;

const impersonationSessionSelect = {
  id: true,
  super_admin_id: true,
  target_company_id: true,
  started_at: true,
  ended_at: true,
  reason: true,
} satisfies Prisma.PlatformImpersonationSessionSelect;

type CompanyRecord = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;
type PlatformAdminRecord = Prisma.PlatformSuperAdminGetPayload<{
  select: typeof platformAdminSelect;
}>;
type TenantUserRecord = Prisma.UserGetPayload<{
  select: typeof tenantUserSelect;
}>;
type ImpersonationSessionRecord =
  Prisma.PlatformImpersonationSessionGetPayload<{
    select: typeof impersonationSessionSelect;
  }>;

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: TenantProvisioningService,
    private readonly authService: AuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PlatformService.name);
  }

  async listCompanies(): Promise<PlatformCompanyResponseDto[]> {
    const companies = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.findMany({
        orderBy: { created_at: 'desc' },
        select: companySelect,
      });
    });

    return companies.map(mapCompany);
  }

  async createCompany(
    dto: CreatePlatformCompanyDto,
    actorAdminId: string,
  ): Promise<PlatformCompanyResponseDto> {
    const { company } = await this.provisioning.provisionCompany(
      {
        name: dto.name,
        slug: dto.slug,
        timezone: dto.timezone,
        defaultCurrency: dto.defaultCurrency,
        language: dto.language,
        country: dto.country,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        planId: dto.planId,
        owner: dto.owner,
      },
      actorAdminId,
    );

    return mapCompany(company);
  }

  async getCompany(companyId: string): Promise<PlatformCompanyResponseDto> {
    const company = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.findUnique({
        where: { id: companyId },
        select: companySelect,
      });
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return mapCompany(company);
  }

  async updateCompany(
    companyId: string,
    dto: UpdatePlatformCompanyDto,
    actorAdminId: string,
  ): Promise<PlatformCompanyResponseDto> {
    await this.ensureCompanyExists(companyId);

    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.defaultCurrency !== undefined) {
      data.default_currency = dto.defaultCurrency;
    }
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.contactEmail !== undefined) data.contact_email = dto.contactEmail;
    if (dto.contactPhone !== undefined) data.contact_phone = dto.contactPhone;
    if (dto.planId !== undefined) data.plan_id = dto.planId;

    const company = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.update({
        where: { id: companyId },
        data,
        select: companySelect,
      });
    });

    await this.appendPlatformAudit({
      actorId: actorAdminId,
      action: 'platform.company.updated',
      targetType: 'company',
      targetId: companyId,
      companyId,
      metadata: {
        name: dto.name,
        timezone: dto.timezone,
        defaultCurrency: dto.defaultCurrency,
        language: dto.language,
        country: dto.country,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        planId: dto.planId,
      },
    });

    this.logger.info({ companyId, actorAdminId }, 'Platform company updated');

    return mapCompany(company);
  }

  async changeCompanyStatus(
    companyId: string,
    dto: ChangeCompanyStatusDto,
    actorAdminId: string,
  ): Promise<PlatformCompanyResponseDto> {
    await this.ensureCompanyExists(companyId);

    const company = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.update({
        where: { id: companyId },
        data: { status: dto.status },
        select: companySelect,
      });
    });

    await this.appendPlatformAudit({
      actorId: actorAdminId,
      action: 'platform.company.status-changed',
      targetType: 'company',
      targetId: companyId,
      companyId,
      metadata: { status: dto.status },
    });

    this.logger.info(
      { companyId, status: dto.status, actorAdminId },
      'Platform company status changed',
    );

    return mapCompany(company);
  }

  async archiveCompany(
    companyId: string,
    actorAdminId: string,
  ): Promise<PlatformCompanyResponseDto> {
    return await this.changeCompanyStatus(
      companyId,
      { status: CompanyStatus.archived },
      actorAdminId,
    );
  }

  async seedOwner(
    companyId: string,
    dto: ProvisionOwnerDto,
    actorAdminId: string,
  ): Promise<TenantUserViewDto> {
    const owner = await this.provisioning.seedOwner(
      companyId,
      dto,
      actorAdminId,
    );

    return mapProvisionedOwner(owner);
  }

  async listTenantUsers(companyId: string): Promise<TenantUserViewDto[]> {
    await this.ensureCompanyExists(companyId);

    const users = await this.prisma.runWithTenant(companyId, async () => {
      return await this.prisma.user.findMany({
        orderBy: { created_at: 'asc' },
        select: tenantUserSelect,
      });
    });

    return users.map(mapTenantUser);
  }

  async listAdmins(): Promise<PlatformAdminResponseDto[]> {
    const admins = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformSuperAdmin.findMany({
        orderBy: { created_at: 'asc' },
        select: platformAdminSelect,
      });
    });

    return admins.map(mapPlatformAdmin);
  }

  async createAdmin(
    dto: CreatePlatformAdminDto,
    actorAdminId: string,
  ): Promise<PlatformAdminResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const admin = await this.prisma.runWithoutTenant(async () => {
        return await this.prisma.platformSuperAdmin.create({
          data: {
            email: dto.email,
            password_hash: passwordHash,
            status: PlatformAdminStatus.active,
          },
          select: platformAdminSelect,
        });
      });

      await this.appendPlatformAudit({
        actorId: actorAdminId,
        action: 'platform.admin.created',
        targetType: 'platform_super_admin',
        targetId: admin.id,
      });

      return mapPlatformAdmin(admin);
    } catch (error) {
      if (isPrismaCode(error, 'P2002')) {
        throw new ConflictException(
          'A platform admin with this email already exists',
        );
      }

      throw error;
    }
  }

  async getAdmin(adminId: string): Promise<PlatformAdminResponseDto> {
    const admin = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformSuperAdmin.findUnique({
        where: { id: adminId },
        select: platformAdminSelect,
      });
    });

    if (!admin) {
      throw new NotFoundException('Platform admin not found');
    }

    return mapPlatformAdmin(admin);
  }

  async updateAdmin(
    adminId: string,
    dto: UpdatePlatformAdminDto,
    actorAdminId: string,
  ): Promise<PlatformAdminResponseDto> {
    const target = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformSuperAdmin.findUnique({
        where: { id: adminId },
        select: { id: true, status: true },
      });
    });

    if (!target) {
      throw new NotFoundException('Platform admin not found');
    }

    if (dto.status === PlatformAdminStatus.suspended) {
      if (adminId === actorAdminId) {
        throw new BadRequestException('You cannot suspend your own account');
      }

      const otherActiveAdmins = await this.prisma.runWithoutTenant(async () => {
        return await this.prisma.platformSuperAdmin.count({
          where: {
            id: { not: adminId },
            status: PlatformAdminStatus.active,
          },
        });
      });

      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'Cannot suspend the last active platform admin',
        );
      }
    }

    const admin = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformSuperAdmin.update({
        where: { id: adminId },
        data: { status: dto.status },
        select: platformAdminSelect,
      });
    });

    await this.appendPlatformAudit({
      actorId: actorAdminId,
      action: 'platform.admin.status-changed',
      targetType: 'platform_super_admin',
      targetId: adminId,
      metadata: { status: dto.status },
    });

    return mapPlatformAdmin(admin);
  }

  async startImpersonation(
    companyId: string,
    dto: StartImpersonationDto,
    actorAdminId: string,
  ): Promise<StartImpersonationResponseDto> {
    const company = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.active) {
      throw new BadRequestException('Cannot impersonate a non-active company');
    }

    const activeSession = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformImpersonationSession.findFirst({
        where: {
          super_admin_id: actorAdminId,
          target_company_id: companyId,
          ended_at: null,
        },
        select: { id: true },
      });
    });

    if (activeSession) {
      throw new ConflictException(
        'An active impersonation session already exists for this company',
      );
    }

    const session = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformImpersonationSession.create({
        data: {
          super_admin_id: actorAdminId,
          target_company_id: companyId,
          reason: dto.reason ?? null,
        },
        select: impersonationSessionSelect,
      });
    });

    const { accessToken, expiresAt } =
      this.authService.generateImpersonationAccessToken({
        adminId: actorAdminId,
        companyId,
        sessionId: session.id,
      });

    await this.appendPlatformAudit({
      actorId: actorAdminId,
      action: 'platform.impersonation.started',
      targetType: 'company',
      targetId: companyId,
      companyId,
      metadata: { sessionId: session.id, reason: dto.reason ?? null },
    });

    return {
      accessToken,
      sessionId: session.id,
      companyId,
      expiresAt,
    };
  }

  async endImpersonation(
    sessionId: string,
    actorAdminId: string,
  ): Promise<void> {
    const session = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformImpersonationSession.findUnique({
        where: { id: sessionId },
        select: impersonationSessionSelect,
      });
    });

    if (!session) {
      throw new NotFoundException('Impersonation session not found');
    }

    if (session.ended_at) {
      throw new ConflictException('Impersonation session is already ended');
    }

    await this.prisma.runWithoutTenant(async () => {
      await this.prisma.platformImpersonationSession.update({
        where: { id: sessionId },
        data: { ended_at: new Date() },
      });
    });

    await this.appendPlatformAudit({
      actorId: actorAdminId,
      action: 'platform.impersonation.ended',
      targetType: 'company',
      targetId: session.target_company_id,
      companyId: session.target_company_id,
      metadata: {
        sessionId,
        originalAdminId: session.super_admin_id,
      },
    });
  }

  async listImpersonationSessions(
    companyId?: string,
  ): Promise<ImpersonationSessionResponseDto[]> {
    const sessions = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.platformImpersonationSession.findMany({
        where: companyId ? { target_company_id: companyId } : undefined,
        orderBy: { started_at: 'desc' },
        select: impersonationSessionSelect,
      });
    });

    return sessions.map(mapImpersonationSession);
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.runWithoutTenant(async () => {
      return await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }

  private async appendPlatformAudit(input: {
    action: string;
    actorId: string;
    targetType?: string | null;
    targetId?: string | null;
    companyId?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.prisma.runWithoutTenant(async () => {
      await this.prisma.platformAuditEvent.create({
        data: {
          actor_type: PlatformAuditActorType.super_admin,
          actor_id: input.actorId,
          action: input.action,
          target_type: input.targetType ?? null,
          target_id: input.targetId ?? null,
          company_id: input.companyId ?? null,
          metadata:
            input.metadata === undefined || input.metadata === null
              ? Prisma.JsonNull
              : (input.metadata as Prisma.InputJsonObject),
        },
      });
    });
  }
}

function mapCompany(company: CompanyRecord): PlatformCompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    status: company.status,
    timezone: company.timezone,
    defaultCurrency: company.default_currency,
    language: company.language,
    country: company.country,
    contactEmail: company.contact_email,
    contactPhone: company.contact_phone,
    planId: company.plan_id,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  };
}

function mapTenantUser(user: TenantUserRecord): TenantUserViewDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function mapProvisionedOwner(user: {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}): TenantUserViewDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function mapPlatformAdmin(
  admin: PlatformAdminRecord,
): PlatformAdminResponseDto {
  return {
    id: admin.id,
    email: admin.email,
    status: admin.status,
    createdAt: admin.created_at,
    updatedAt: admin.updated_at,
  };
}

function mapImpersonationSession(
  session: ImpersonationSessionRecord,
): ImpersonationSessionResponseDto {
  return {
    id: session.id,
    superAdminId: session.super_admin_id,
    targetCompanyId: session.target_company_id,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    reason: session.reason,
  };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
