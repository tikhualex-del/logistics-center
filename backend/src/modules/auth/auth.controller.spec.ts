import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type MockResponse = Pick<Response, 'cookie' | 'clearCookie'>;

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
  refreshCookieName: 'refreshToken',
  refreshCookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
  clearCookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  },
};

function createMockResponse(): MockResponse {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('sets refresh cookie on register', async () => {
    const dto = {
      email: 'admin@example.com',
      password: 'SecurePass123!',
      firstName: 'Ivan',
      lastName: 'Petrov',
      companyName: 'Fast Delivery',
    };
    const res = createMockResponse();
    const serviceResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'admin' as const,
        companyId: 'company-1',
      },
    };
    mockAuthService.register.mockResolvedValue(serviceResult);

    const result = await controller.register(dto, res as Response);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      mockAuthService.refreshCookieName,
      'refresh-token',
      mockAuthService.refreshCookieOptions,
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      user: expect.objectContaining({ email: dto.email }),
    });
  });

  it('sets refresh cookie on login', async () => {
    const dto = { email: 'admin@example.com', password: 'SecurePass123!' };
    const res = createMockResponse();
    mockAuthService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: dto.email,
        firstName: 'Ivan',
        lastName: 'Petrov',
        role: 'admin',
        companyId: 'company-1',
      },
    });

    const result = await controller.login(dto, res as Response);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      mockAuthService.refreshCookieName,
      'refresh-token',
      mockAuthService.refreshCookieOptions,
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      user: expect.objectContaining({ email: dto.email }),
    });
  });

  it('rotates refresh cookie on refresh', async () => {
    const req = {
      user: {
        sub: 'user-1',
        companyId: 'company-1',
      },
    };
    const res = createMockResponse();
    mockAuthService.refreshTokens.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await controller.refresh(req as never, res as Response);

    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
      'user-1',
      'company-1',
    );
    expect(res.cookie).toHaveBeenCalledWith(
      mockAuthService.refreshCookieName,
      'new-refresh-token',
      mockAuthService.refreshCookieOptions,
    );
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('clears refresh cookie on logout', async () => {
    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      role: UserRole.admin,
      companyId: 'company-1',
    };
    const res = createMockResponse();
    mockAuthService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(user, res as Response);

    expect(mockAuthService.logout).toHaveBeenCalledWith(
      'user-1',
      'company-1',
      'admin',
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      mockAuthService.refreshCookieName,
      mockAuthService.clearCookieOptions,
    );
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
