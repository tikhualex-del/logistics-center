import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourierStatus, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  company_id: true,
  role: true,
  email: true,
  phone: true,
  first_name: true,
  last_name: true,
  is_active: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

type UserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;

type UserProfileSnapshot = {
  role: UserRole;
  courier: { status: CourierStatus } | null;
  dispatcher: { is_active: boolean } | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async getMe(userId: string, companyId: string): Promise<UserResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: userSelect,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return mapUser(user);
    });
  }

  async listUsers(companyId: string): Promise<UserResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const users = await this.prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        select: userSelect,
      });

      return users.map(mapUser);
    });
  }

  async createUser(
    companyId: string,
    dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({
          where: {
            company_id: companyId,
            email: dto.email,
          },
          select: { id: true },
        });

        if (existing) {
          throw new ConflictException(
            'Email is already registered in this company',
          );
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const createdUser = await tx.user.create({
          data: {
            company_id: companyId,
            role: dto.role,
            email: dto.email,
            phone: dto.phone ?? null,
            first_name: dto.firstName,
            last_name: dto.lastName ?? null,
            password_hash: passwordHash,
            is_active: true,
          },
          select: userSelect,
        });

        await this.syncRoleProfiles(tx, {
          companyId,
          userId: createdUser.id,
          nextRole: createdUser.role,
          isActive: createdUser.is_active,
        });

        this.logger.info(
          {
            userId: createdUser.id,
            companyId,
            role: createdUser.role,
          },
          'User created',
        );

        return mapUser(createdUser);
      });
    });
  }

  async updateUser(
    companyId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.prisma.runWithTenant(companyId, async () => {
      return await this.prisma.$transaction(async (tx) => {
        const currentUser = await tx.user.findFirst({
          where: {
            id: userId,
            company_id: companyId,
          },
          select: {
            ...userSelect,
            courier: {
              select: {
                status: true,
              },
            },
            dispatcher: {
              select: {
                is_active: true,
              },
            },
          },
        });

        if (!currentUser) {
          throw new NotFoundException('User not found');
        }

        if (dto.email && dto.email !== currentUser.email) {
          const existing = await tx.user.findFirst({
            where: {
              company_id: companyId,
              email: dto.email,
              id: { not: userId },
            },
            select: { id: true },
          });

          if (existing) {
            throw new ConflictException(
              'Email is already registered in this company',
            );
          }
        }

        const data: Prisma.UserUpdateInput = {};
        if (dto.role !== undefined) data.role = dto.role;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.phone !== undefined) data.phone = dto.phone;
        if (dto.firstName !== undefined) data.first_name = dto.firstName;
        if (dto.lastName !== undefined) data.last_name = dto.lastName;
        if (dto.isActive !== undefined) data.is_active = dto.isActive;
        if (dto.password !== undefined) {
          data.password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data,
          select: userSelect,
        });

        await this.syncRoleProfiles(tx, {
          companyId,
          userId: updatedUser.id,
          nextRole: updatedUser.role,
          isActive: updatedUser.is_active,
          previous: {
            role: currentUser.role,
            courier: currentUser.courier,
            dispatcher: currentUser.dispatcher,
          },
        });

        this.logger.info(
          {
            userId: updatedUser.id,
            companyId,
            role: updatedUser.role,
          },
          'User updated',
        );

        return mapUser(updatedUser);
      });
    });
  }

  private async syncRoleProfiles(
    tx: Prisma.TransactionClient,
    options: {
      companyId: string;
      userId: string;
      nextRole: UserRole;
      isActive: boolean;
      previous?: UserProfileSnapshot;
    },
  ): Promise<void> {
    const { companyId, userId, nextRole, isActive, previous } = options;

    const courierProfile =
      previous?.courier ??
      (await tx.courier.findUnique({
        where: { user_id: userId },
        select: { status: true },
      }));
    const dispatcherProfile =
      previous?.dispatcher ??
      (await tx.dispatcher.findUnique({
        where: { user_id: userId },
        select: { is_active: true },
      }));

    if (nextRole === UserRole.courier) {
      await tx.courier.upsert({
        where: { user_id: userId },
        create: {
          company_id: companyId,
          user_id: userId,
          status: isActive ? CourierStatus.offline : CourierStatus.inactive,
        },
        update: {
          company_id: companyId,
          status: resolveCourierStatus({
            isActive,
            previousRole: previous?.role,
            previousStatus: courierProfile?.status,
          }),
        },
      });

      if (dispatcherProfile) {
        await tx.dispatcher.update({
          where: { user_id: userId },
          data: { is_active: false },
        });
      }

      return;
    }

    if (nextRole === UserRole.dispatcher) {
      await tx.dispatcher.upsert({
        where: { user_id: userId },
        create: {
          company_id: companyId,
          user_id: userId,
          is_active: isActive,
        },
        update: {
          company_id: companyId,
          is_active: isActive,
        },
      });

      if (courierProfile) {
        await tx.courier.update({
          where: { user_id: userId },
          data: { status: CourierStatus.inactive },
        });
      }

      return;
    }

    if (courierProfile) {
      await tx.courier.update({
        where: { user_id: userId },
        data: { status: CourierStatus.inactive },
      });
    }

    if (dispatcherProfile) {
      await tx.dispatcher.update({
        where: { user_id: userId },
        data: { is_active: false },
      });
    }
  }
}

function resolveCourierStatus(options: {
  isActive: boolean;
  previousRole?: UserRole;
  previousStatus?: CourierStatus;
}): CourierStatus {
  const { isActive, previousRole, previousStatus } = options;

  if (!isActive) {
    return CourierStatus.inactive;
  }

  if (previousRole !== UserRole.courier) {
    return CourierStatus.offline;
  }

  if (!previousStatus || previousStatus === CourierStatus.inactive) {
    return CourierStatus.offline;
  }

  return previousStatus;
}

function mapUser(user: UserRecord): UserResponseDto {
  return {
    id: user.id,
    companyId: user.company_id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
