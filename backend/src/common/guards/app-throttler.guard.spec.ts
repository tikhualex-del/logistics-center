import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { REQUEST_ID_HEADER } from '../http/request-id';
import { RequestIdInterceptor } from '../interceptors/request-id.interceptor';
import { ResponseEnvelopeInterceptor } from '../interceptors/response-envelope.interceptor';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { AppThrottlerGuard } from './app-throttler.guard';

@Controller('throttler-test')
class ThrottlerTestController {
  @Get()
  getValue(): { ok: true } {
    return { ok: true };
  }
}

describe('AppThrottlerGuard', () => {
  let app: INestApplication;

  const logger = {
    error: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 1000,
            limit: 1,
          },
        ]),
      ],
      controllers: [ThrottlerTestController],
      providers: [
        TenantContextService,
        RequestIdInterceptor,
        ResponseEnvelopeInterceptor,
        AllExceptionsFilter,
        AppThrottlerGuard,
        {
          provide: PinoLogger,
          useValue: logger,
        },
        {
          provide: APP_GUARD,
          useExisting: AppThrottlerGuard,
        },
        {
          provide: APP_INTERCEPTOR,
          useExisting: RequestIdInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useExisting: ResponseEnvelopeInterceptor,
        },
        {
          provide: APP_FILTER,
          useExisting: AllExceptionsFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 with the standard error payload after the limit is exceeded', async () => {
    await request(app.getHttpServer())
      .get('/throttler-test')
      .set(REQUEST_ID_HEADER, 'req-123')
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/throttler-test')
      .set(REQUEST_ID_HEADER, 'req-456')
      .expect(429);

    expect(response.headers['x-request-id']).toBe('req-456');
    expect(response.body).toEqual({
      statusCode: 429,
      message: expect.stringMatching(/too many requests/i),
      error: 'Too Many Requests',
      requestId: 'req-456',
    });
  });
});
