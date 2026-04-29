import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { REQUEST_ID_HEADER } from '../http/request-id';
import { RequestIdInterceptor } from './request-id.interceptor';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { TenantContextService } from '../../prisma/tenant-context.service';

@Controller('response-envelope-test')
class ResponseEnvelopeTestController {
  @Get('string')
  getString(): string {
    return 'hello';
  }

  @Get('object')
  getObject(): { ok: boolean } {
    return { ok: true };
  }
}

describe('ResponseEnvelopeInterceptor', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ResponseEnvelopeTestController],
      providers: [
        TenantContextService,
        RequestIdInterceptor,
        ResponseEnvelopeInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: RequestIdInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useExisting: ResponseEnvelopeInterceptor,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('wraps successful responses and preserves the incoming requestId', async () => {
    const response = await request(app.getHttpServer())
      .get('/response-envelope-test/string')
      .set(REQUEST_ID_HEADER, 'req-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('req-123');
    expect(response.body).toEqual({
      data: 'hello',
      meta: {
        requestId: 'req-123',
        timestamp: expect.any(String),
      },
    });
    expect(response.body.meta.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it('generates requestId and wraps object payloads when the header is missing', async () => {
    const response = await request(app.getHttpServer())
      .get('/response-envelope-test/object')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.body).toEqual({
      data: { ok: true },
      meta: {
        requestId: response.headers['x-request-id'],
        timestamp: expect.any(String),
      },
    });
  });
});
