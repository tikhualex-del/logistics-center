import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { SocketAuthService } from './socket-auth.service';

const mockAuthService = {
  validateUser: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('SocketAuthService', () => {
  let service: SocketAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketAuthService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SocketAuthService>(SocketAuthService);
  });

  it('authenticates socket from auth token', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      companyId: 'company-1',
      role: UserRole.dispatcher,
      email: 'dispatcher@example.com',
    });
    mockAuthService.validateUser.mockResolvedValue({
      id: 'user-1',
      email: 'dispatcher@example.com',
      role: UserRole.dispatcher,
      companyId: 'company-1',
    });

    await expect(
      service.authenticateSocket(
        createClient({ auth: { token: 'dispatcher-token' } }) as never,
        [UserRole.dispatcher, UserRole.admin],
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'user-1',
        role: UserRole.dispatcher,
      }),
    );
  });

  it('authenticates socket from authorization header', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-2',
      companyId: 'company-1',
      role: UserRole.admin,
      email: 'admin@example.com',
    });
    mockAuthService.validateUser.mockResolvedValue({
      id: 'user-2',
      email: 'admin@example.com',
      role: UserRole.admin,
      companyId: 'company-1',
    });

    await expect(
      service.authenticateSocket(
        createClient({
          headers: { authorization: 'Bearer admin-token' },
        }) as never,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'user-2',
        role: UserRole.admin,
      }),
    );
  });

  it('rejects sockets without token', async () => {
    await expect(
      service.authenticateSocket(createClient() as never),
    ).rejects.toThrow('Missing access token');
  });

  it('rejects role outside allowed list', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-3',
      companyId: 'company-1',
      role: UserRole.courier,
      email: 'courier@example.com',
    });
    mockAuthService.validateUser.mockResolvedValue({
      id: 'user-3',
      email: 'courier@example.com',
      role: UserRole.courier,
      companyId: 'company-1',
    });

    await expect(
      service.authenticateSocket(
        createClient({ auth: { token: 'courier-token' } }) as never,
        [UserRole.admin, UserRole.dispatcher],
      ),
    ).rejects.toThrow('Role courier is not allowed for this socket');
  });
});

function createClient(options?: {
  auth?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}) {
  return {
    handshake: {
      auth: options?.auth ?? {},
      headers: options?.headers ?? {},
    },
  };
}
