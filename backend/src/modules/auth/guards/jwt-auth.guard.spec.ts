import {
  Controller,
  Get,
  UseGuards,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth-request.types';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

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
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentUser('email') email: string,
  ) {
    return { user, email };
  }

  @Get('public')
  @Public()
  @UseGuards(JwtAuthGuard)
  getPublicRoute() {
    return { ok: true };
  }
}

describe('JwtAuthGuard', () => {
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

        return null;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [ProtectedController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
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

  it('allows request with a valid bearer token and attaches req.user', async () => {
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

    expect(mockAuthService.validateUser).toHaveBeenCalledWith(
      'user-1',
      'company-1',
    );
  });

  it('rejects request without bearer token', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('rejects request when strategy validation returns no user', async () => {
    const token = jwtService.sign({
      sub: 'missing-user',
      companyId: 'company-1',
      role: 'admin',
      email: 'ghost@example.com',
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('allows route marked with @Public() without bearer token', async () => {
    await request(app.getHttpServer())
      .get('/protected/public')
      .expect(200)
      .expect({ ok: true });
  });

  it('injects user data via @CurrentUser()', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      companyId: 'company-1',
      role: 'admin',
      email: 'admin@example.com',
    });

    await request(app.getHttpServer())
      .get('/protected/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('admin@example.com');
        expect(body.user.companyId).toBe('company-1');
      });
  });
});
