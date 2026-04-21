import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, AuditActorRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { CookieOptions } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from './auth-request.types';
import { getAuthSecret } from './auth.config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUserDto, TokenResponseDto } from './dto/token-response.dto';

export interface JwtPayload {
  sub: string;
  companyId: string;
  role: string;
  email: string;
}

export interface RefreshJwtPayload {
  sub: string;
  companyId: string;
}

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Prisma Json field: use Prisma.JsonNull for SQL NULL in a Json column
const JSON_NULL = Prisma.JsonNull;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  // ----------------------------------------------------------------
  // Public cookie helpers (used by controller)
  // ----------------------------------------------------------------

  get refreshCookieName(): string {
    return 'refreshToken';
  }

  get refreshCookieOptions(): CookieOptions {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/',
    };
  }

  get clearCookieOptions(): CookieOptions {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    };
  }

  // ----------------------------------------------------------------
  // Register: создать компанию + admin пользователя
  // ----------------------------------------------------------------

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    // Поиск существующего email выполняется без tenant-контекста (регистрация публичная)
    const existing = await this.prisma.runWithoutTenant(async () => {
      return this.prisma.user.findFirst({ where: { email: dto.email } });
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Создание компании + пользователя в транзакции без tenant-контекста
    const user = await this.prisma.runWithoutTenant(async () => {
      return this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: dto.companyName },
        });

        const newUser = await tx.user.create({
          data: {
            company_id: company.id,
            email: dto.email,
            first_name: dto.firstName,
            last_name: dto.lastName ?? null,
            password_hash: passwordHash,
            role: 'admin',
            is_active: true,
          },
        });

        // Аудит: регистрация нового пользователя
        await tx.auditLog.create({
          data: {
            company_id: company.id,
            actor_id: newUser.id,
            actor_role: AuditActorRole.admin,
            action: 'user.registered',
            entity_type: 'user',
            entity_id: newUser.id,
            before: JSON_NULL,
            after: {
              email: newUser.email,
              role: newUser.role,
              company_id: company.id,
            },
          },
        });

        return newUser;
      });
    });

    this.logger.info(
      { userId: user.id, companyId: user.company_id, email: user.email },
      'User registered',
    );

    const { accessToken } = this.generateAccessToken(
      user.id,
      user.company_id,
      user.role,
      user.email,
    );

    return {
      accessToken,
      user: mapToAuthUser(user),
    };
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUserDto }> {
    // Поиск по email без tenant-контекста (публичный endpoint)
    const user = await this.prisma.runWithoutTenant(async () => {
      return this.prisma.user.findFirst({ where: { email: dto.email } });
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Обновление last_login_at в контексте пользователя
    await this.prisma.runWithTenant(user.company_id, async () => {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });

      // Аудит: вход в систему
      await this.prisma.auditLog.create({
        data: {
          company_id: user.company_id,
          actor_id: user.id,
          actor_role: user.role as AuditActorRole,
          action: 'user.logged-in',
          entity_type: 'user',
          entity_id: user.id,
          before: JSON_NULL,
          after: { last_login_at: new Date().toISOString() },
        },
      });
    });

    this.logger.info(
      { userId: user.id, companyId: user.company_id },
      'User logged in',
    );

    const { accessToken } = this.generateAccessToken(
      user.id,
      user.company_id,
      user.role,
      user.email,
    );
    const { refreshToken } = this.generateRefreshToken(
      user.id,
      user.company_id,
    );

    return { accessToken, refreshToken, user: mapToAuthUser(user) };
  }

  // ----------------------------------------------------------------
  // Refresh tokens (rotation)
  // ----------------------------------------------------------------

  async refreshTokens(
    userId: string,
    companyId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Проверяем что пользователь существует и активен
    const user = await this.prisma.runWithTenant(companyId, async () => {
      return this.prisma.user.findFirst({ where: { id: userId } });
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or disabled');
    }

    const { accessToken } = this.generateAccessToken(
      user.id,
      user.company_id,
      user.role,
      user.email,
    );
    const { refreshToken } = this.generateRefreshToken(
      user.id,
      user.company_id,
    );

    this.logger.info(
      { userId: user.id, companyId: user.company_id },
      'Tokens refreshed',
    );

    return { accessToken, refreshToken };
  }

  // ----------------------------------------------------------------
  // Logout
  // ----------------------------------------------------------------

  async logout(userId: string, companyId: string, role: string): Promise<void> {
    await this.prisma.runWithTenant(companyId, async () => {
      await this.prisma.auditLog.create({
        data: {
          company_id: companyId,
          actor_id: userId,
          actor_role: role as AuditActorRole,
          action: 'user.logged-out',
          entity_type: 'user',
          entity_id: userId,
          before: JSON_NULL,
          after: { logged_out_at: new Date().toISOString() },
        },
      });
    });

    this.logger.info({ userId, companyId, role }, 'User logged out');
  }

  // ----------------------------------------------------------------
  // Validate user — используется JWT стратегией
  // ----------------------------------------------------------------

  async validateUser(
    userId: string,
    companyId: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.runWithTenant(companyId, async () => {
      return this.prisma.user.findFirst({
        where: { id: userId, is_active: true },
        select: {
          id: true,
          email: true,
          role: true,
          company_id: true,
        },
      });
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
    };
  }

  // ----------------------------------------------------------------
  // Token generators
  // ----------------------------------------------------------------

  private generateAccessToken(
    userId: string,
    companyId: string,
    role: string,
    email: string,
  ): { accessToken: string } {
    const payload: JwtPayload = { sub: userId, companyId, role, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: getAuthSecret(this.config, 'JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });
    return { accessToken };
  }

  private generateRefreshToken(
    userId: string,
    companyId: string,
  ): { refreshToken: string } {
    const payload: RefreshJwtPayload = { sub: userId, companyId };
    const refreshToken = this.jwtService.sign(payload, {
      secret: getAuthSecret(this.config, 'JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL,
    });
    return { refreshToken };
  }
}

// ----------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------

function mapToAuthUser(user: {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: string;
  company_id: string;
}): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role as AuthUserDto['role'],
    companyId: user.company_id,
  };
}
