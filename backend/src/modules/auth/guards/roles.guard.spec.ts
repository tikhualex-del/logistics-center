import { Controller, Get, Req, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser, RequestWithUser } from '../auth-request.types';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';

const JWT_SECRET = 'test-jwt-secret';

const mockAuthService = {
  validateUser: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_SECRET,
      NODE_ENV: 'test',
    };

    return values[key];
  }),
};

@Controller('protected')
class ProtectedController {
  @Get('open')
  getOpen(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('admin')
  @Roles(UserRole.admin)
  getAdminOnly(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('ops')
  @Roles(UserRole.admin, UserRole.dispatcher)
  getOperations(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }
}

describe('RolesGuard', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    mockAuthService.validateUser.mockReset();
    mockConfigService.get.mockClear();
    mockAuthService.validateUser.mockImplementation(
      async (userId: string, companyId: string) => {
        const users: Record<string, AuthenticatedUser> = {
          admin: {
            id: 'admin',
            email: 'admin@example.com',
            role: UserRole.admin,
            companyId: 'company-1',
          },
          dispatcher: {
            id: 'dispatcher',
            email: 'dispatcher@example.com',
            role: UserRole.dispatcher,
            companyId: 'company-1',
          },
        };

        const user = users[userId];
        if (!user || companyId !== 'company-1') {
          return null;
        }

        return user;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [ProtectedController],
      providers: [
        JwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    jwtService = new JwtService({ secret: JWT_SECRET });
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows authenticated route without role metadata', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/open')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.role).toBe(UserRole.dispatcher);
      });
  });

  it('allows admin on admin-only route', async () => {
    const token = signToken(jwtService, 'admin', UserRole.admin);

    await request(app.getHttpServer())
      .get('/protected/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.role).toBe(UserRole.admin);
      });
  });

  it('rejects dispatcher on admin-only route', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows dispatcher on route that accepts dispatcher role', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/ops')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

function signToken(
  jwtService: JwtService,
  userId: string,
  role: UserRole,
): string {
  return jwtService.sign({
    sub: userId,
    companyId: 'company-1',
    role,
    email: `${userId}@example.com`,
  });
}
