import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

// ----------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------

const mockUser = {
  id: 'user-uuid-1',
  company_id: 'company-uuid-1',
  email: 'test@example.com',
  first_name: 'Ivan',
  last_name: 'Petrov',
  role: 'admin',
  is_active: true,
  password_hash: null as string | null,
};

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  runWithoutTenant: jest.fn(),
  runWithTenant: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    };
    return map[key];
  }),
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    };
    const val = map[key];
    if (!val) throw new Error(`Config key ${key} not found`);
    return val;
  }),
};

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ----------------------------------------------------------------
// Test suite
// ----------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Настраиваем runWithoutTenant и runWithTenant как passthrough
    mockPrismaService.runWithoutTenant.mockImplementation(
      (cb: () => Promise<unknown>) => cb(),
    );
    mockPrismaService.runWithTenant.mockImplementation(
      (_companyId: string, cb: () => Promise<unknown>) => cb(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    // Переустанавливаем passthrough после clearAllMocks
    mockPrismaService.runWithoutTenant.mockImplementation(
      (cb: () => Promise<unknown>) => cb(),
    );
    mockPrismaService.runWithTenant.mockImplementation(
      (_companyId: string, cb: () => Promise<unknown>) => cb(),
    );
  });

  // ----------------------------------------------------------------
  // register()
  // ----------------------------------------------------------------

  describe('register()', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      firstName: 'Ivan',
      lastName: 'Petrov',
      companyName: 'LLC Fast Delivery',
    };

    it('should register a new user and return access token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const createdUser = { ...mockUser, email: registerDto.email };
      const createdCompany = {
        id: 'company-uuid-1',
        name: registerDto.companyName,
      };

      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            company: { create: jest.fn().mockResolvedValue(createdCompany) },
            user: { create: jest.fn().mockResolvedValue(createdUser) },
            auditLog: { create: jest.fn().mockResolvedValue({}) },
          };
          return cb(tx);
        },
      );

      mockJwtService.sign.mockReturnValue('access-token-123');

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe('admin');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: createdUser.id,
          companyId: createdUser.company_id,
          role: createdUser.role,
          email: createdUser.email,
        },
        {
          secret: 'test-jwt-secret',
          expiresIn: '15m',
        },
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ----------------------------------------------------------------
  // login()
  // ----------------------------------------------------------------

  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'SecurePass123!' };

    beforeEach(async () => {
      // Хэшируем пароль для теста
      mockUser.password_hash = await bcrypt.hash('SecurePass123!', 10);
    });

    it('should return tokens and user on valid credentials', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ ...mockUser });
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser });
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          sub: mockUser.id,
          companyId: mockUser.company_id,
          role: mockUser.role,
          email: mockUser.email,
        },
        {
          secret: 'test-jwt-secret',
          expiresIn: '15m',
        },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockUser.id,
          companyId: mockUser.company_id,
        },
        {
          secret: 'test-refresh-secret',
          expiresIn: '30d',
        },
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ ...mockUser });

      await expect(
        service.login({ email: loginDto.email, password: 'WrongPass123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password_hash is null', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        password_hash: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ----------------------------------------------------------------
  // refreshTokens()
  // ----------------------------------------------------------------

  describe('refreshTokens()', () => {
    it('should return new token pair for valid user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ ...mockUser });
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(
        mockUser.id,
        mockUser.company_id,
      );

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          sub: mockUser.id,
          companyId: mockUser.company_id,
          role: mockUser.role,
          email: mockUser.email,
        },
        {
          secret: 'test-jwt-secret',
          expiresIn: '15m',
        },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockUser.id,
          companyId: mockUser.company_id,
        },
        {
          secret: 'test-refresh-secret',
          expiresIn: '30d',
        },
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshTokens('nonexistent', 'company-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(
        service.refreshTokens(mockUser.id, mockUser.company_id),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ----------------------------------------------------------------
  // logout()
  // ----------------------------------------------------------------

  describe('logout()', () => {
    it('should write audit log entry on logout', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await expect(
        service.logout(mockUser.id, mockUser.company_id, mockUser.role),
      ).resolves.toBeUndefined();

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------
  // validateUser()
  // ----------------------------------------------------------------

  describe('validateUser()', () => {
    it('should return user object when user exists and is active', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        company_id: mockUser.company_id,
      });

      const result = await service.validateUser(
        mockUser.id,
        mockUser.company_id,
      );

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        companyId: mockUser.company_id,
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'company-1');
      expect(result).toBeNull();
    });
  });
});
