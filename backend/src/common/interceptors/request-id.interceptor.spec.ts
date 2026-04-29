import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { REQUEST_ID_HEADER } from '../http/request-id';
import { RequestIdInterceptor } from './request-id.interceptor';
import { TenantContextService } from '../../prisma/tenant-context.service';

type RequestWithId = Request & { id?: string };

@Controller('request-id-test')
class RequestIdTestController {
  constructor(private readonly tenantContext: TenantContextService) {}

  @Get()
  getRequestId(@Req() req: RequestWithId): {
    requestId?: string;
    requestObjectId?: string;
  } {
    return {
      requestId: this.tenantContext.getRequestId(),
      requestObjectId: req.id,
    };
  }
}

describe('RequestIdInterceptor', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RequestIdTestController],
      providers: [
        TenantContextService,
        RequestIdInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: RequestIdInterceptor,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('preserves incoming X-Request-ID and exposes it through context and response headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/request-id-test')
      .set(REQUEST_ID_HEADER, 'req-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('req-123');
    expect(response.body).toEqual({
      requestId: 'req-123',
      requestObjectId: 'req-123',
    });
  });

  it('generates requestId when the header is missing', async () => {
    const response = await request(app.getHttpServer())
      .get('/request-id-test')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
    expect(response.body.requestObjectId).toBe(
      response.headers['x-request-id'],
    );
  });
});
