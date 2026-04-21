import { Controller, Get, Req, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import type { AuthenticatedUser, RequestWithUser } from '../auth-request.types';
import type { PermissionName } from '../permissions/permission-matrix';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
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

  @Get('payment-rules')
  @RequirePermission('edit:payment-rules')
  getPaymentRules(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('orders')
  @RequirePermission('view:orders')
  getOrders(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('earnings')
  @RequirePermission('view:own-earnings')
  getOwnEarnings(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('orders/edit')
  @RequirePermission('edit:orders')
  editOrders(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('routes/edit')
  @RequirePermission('edit:routes')
  editRoutes(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('users/manage')
  @RequirePermission('manage:users')
  manageUsers(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }

  @Get('multi')
  @RequirePermission('view:orders', 'edit:orders')
  getMultiPermissionRoute(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }
}

describe('PermissionsGuard', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    mockAuthService.validateUser.mockReset();
    mockConfigService.get.mockClear();
    mockAuthService.validateUser.mockImplementation(
      (userId: string, companyId: string) => {
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
          courier: {
            id: 'courier',
            email: 'courier@example.com',
            role: UserRole.courier,
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
        { provide: APP_GUARD, useClass: PermissionsGuard },
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

  it('allows authenticated route without permission metadata', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/open')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as { user: AuthenticatedUser }).user.role).toBe(
          UserRole.dispatcher,
        );
      });
  });

  it('allows admin on payment-rules route', async () => {
    const token = signToken(jwtService, 'admin', UserRole.admin);

    await request(app.getHttpServer())
      .get('/protected/payment-rules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects dispatcher on payment-rules route', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/payment-rules')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows dispatcher on orders route', async () => {
    const token = signToken(jwtService, 'dispatcher', UserRole.dispatcher);

    await request(app.getHttpServer())
      .get('/protected/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('allows courier on own-earnings route', async () => {
    const token = signToken(jwtService, 'courier', UserRole.courier);

    await request(app.getHttpServer())
      .get('/protected/earnings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects courier on payment-rules route', async () => {
    const token = signToken(jwtService, 'courier', UserRole.courier);

    await request(app.getHttpServer())
      .get('/protected/payment-rules')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it.each([
    ['payment-rules', 'edit:payment-rules', 200, 403, 403],
    ['orders', 'view:orders', 200, 200, 200],
    ['orders/edit', 'edit:orders', 200, 200, 403],
    ['routes/edit', 'edit:routes', 200, 200, 403],
    ['earnings', 'view:own-earnings', 200, 403, 200],
    ['users/manage', 'manage:users', 200, 403, 403],
    ['multi', 'view:orders + edit:orders', 200, 200, 403],
  ] as const)(
    'enforces %s permission route for all roles',
    async (
      route,
      _permissionLabel:
        | PermissionName
        | `${PermissionName} + ${PermissionName}`,
      adminStatus,
      dispatcherStatus,
      courierStatus,
    ) => {
      await expectRoleStatus(route, UserRole.admin, adminStatus);
      await expectRoleStatus(route, UserRole.dispatcher, dispatcherStatus);
      await expectRoleStatus(route, UserRole.courier, courierStatus);
    },
  );

  async function expectRoleStatus(
    route: string,
    role: UserRole,
    statusCode: number,
  ): Promise<void> {
    const token = signToken(jwtService, role, role);

    await request(app.getHttpServer())
      .get(`/protected/${route}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(statusCode);
  }
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
