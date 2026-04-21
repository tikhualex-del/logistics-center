import {
  Controller,
  Get,
  Post,
  Req,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Public } from '../../../common/decorators/public.decorator';
import type {
  AuthenticatedUser,
  RequestWithUser,
} from '../auth-request.types';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
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

@Controller('health')
class TestHealthController {
  @Get()
  @Public()
  getHealth() {
    return { status: 'ok' };
  }
}

@Controller('auth')
class TestAuthController {
  @Post('login')
  @Public()
  login() {
    return { ok: true };
  }
}

@Controller('protected')
class ProtectedController {
  @Get()
  getProtected(@Req() req: RequestWithUser<AuthenticatedUser>) {
    return { user: req.user };
  }
}

describe('TenantGuard', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    mockAuthService.validateUser.mockReset();
    mockConfigService.get.mockClear();
    mockAuthService.validateUser.mockImplementation(
      async (userId: string, companyId: string) => {
        if (userId === 'user-1' && companyId === 'company-1') {
          return {
            id: 'user-1',
            email: 'admin@example.com',
            role: 'admin',
            companyId: 'company-1',
          };
        }

        if (userId === 'missing-company') {
          return {
            id: 'missing-company',
            email: 'admin@example.com',
            role: 'admin',
            companyId: '',
          };
        }

        return null;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [
        TestHealthController,
        TestAuthController,
        ProtectedController,
      ],
      providers: [
        JwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantGuard },
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

  it('keeps health endpoint public', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('keeps login endpoint public', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .expect(201)
      .expect({ ok: true });
  });

  it('rejects protected endpoint without JWT before tenant check', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('allows protected endpoint when authenticated user has companyId', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      companyId: 'company-1',
      role: 'admin',
      email: 'admin@example.com',
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            role: 'admin',
            companyId: 'company-1',
          },
        });
      });
  });

  it('rejects authenticated endpoint when companyId is missing', async () => {
    const token = jwtService.sign({
      sub: 'missing-company',
      companyId: 'company-1',
      role: 'admin',
      email: 'admin@example.com',
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
