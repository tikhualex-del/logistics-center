import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TenantContextService } from '../../prisma/tenant-context.service';

@Controller('exception-filter-test')
class ExceptionFilterTestController {
  @Get('bad-request')
  throwBadRequest(): never {
    throw new BadRequestException({
      message: ['name is required'],
      error: 'Bad Request',
    });
  }

  @Get('generic')
  throwGeneric(): never {
    throw new Error('boom');
  }
}

describe('AllExceptionsFilter', () => {
  let app: INestApplication;

  const logger = {
    error: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExceptionFilterTestController],
      providers: [
        TenantContextService,
        AllExceptionsFilter,
        {
          provide: PinoLogger,
          useValue: logger,
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

  it('returns API convention payload for HttpException and keeps header requestId', async () => {
    const response = await request(app.getHttpServer())
      .get('/exception-filter-test/bad-request')
      .set('X-Request-ID', 'req-123')
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['name is required'],
      error: 'Bad Request',
      requestId: 'req-123',
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-123',
        statusCode: 400,
        method: 'GET',
        url: '/exception-filter-test/bad-request',
      }),
      'Unhandled HTTP exception',
    );
  });

  it('returns a safe 500 payload and generates requestId when the request has none', async () => {
    const response = await request(app.getHttpServer())
      .get('/exception-filter-test/generic')
      .expect(500);

    expect(response.body.error).toBe('Internal Server Error');
    expect(response.body.message).toBe('Internal server error');
    expect(response.body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: response.body.requestId,
        statusCode: 500,
        method: 'GET',
        url: '/exception-filter-test/generic',
      }),
      'Unhandled HTTP exception',
    );
  });
});
