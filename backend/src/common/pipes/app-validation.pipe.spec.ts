import {
  Body,
  Controller,
  INestApplication,
  Post,
} from '@nestjs/common';
import {
  APP_FILTER,
  APP_INTERCEPTOR,
  APP_PIPE,
} from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IsInt, IsString, Min } from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { REQUEST_ID_HEADER } from '../http/request-id';
import { RequestIdInterceptor } from '../interceptors/request-id.interceptor';
import { ResponseEnvelopeInterceptor } from '../interceptors/response-envelope.interceptor';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { AppValidationPipe } from './app-validation.pipe';

class ValidationPipeTestDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  count!: number;
}

@Controller('validation-pipe-test')
class ValidationPipeTestController {
  @Post()
  create(@Body() dto: ValidationPipeTestDto): {
    name: string;
    count: number;
    countType: string;
  } {
    return {
      name: dto.name,
      count: dto.count,
      countType: typeof dto.count,
    };
  }
}

describe('AppValidationPipe', () => {
  let app: INestApplication;
  const logger = {
    error: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValidationPipeTestController],
      providers: [
        TenantContextService,
        RequestIdInterceptor,
        ResponseEnvelopeInterceptor,
        AllExceptionsFilter,
        AppValidationPipe,
        {
          provide: PinoLogger,
          useValue: logger,
        },
        {
          provide: APP_PIPE,
          useExisting: AppValidationPipe,
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

  it('transforms valid payloads and returns the wrapped response', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation-pipe-test')
      .set(REQUEST_ID_HEADER, 'req-123')
      .send({
        name: 'box',
        count: '2',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        name: 'box',
        count: 2,
        countType: 'number',
      },
      meta: {
        requestId: 'req-123',
        timestamp: expect.any(String),
      },
    });
  });

  it('rejects non-whitelisted properties with the standard error payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation-pipe-test')
      .set(REQUEST_ID_HEADER, 'req-456')
      .send({
        name: 'box',
        count: 2,
        extra: 'forbidden',
      })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: expect.arrayContaining(['property extra should not exist']),
      error: 'Bad Request',
      requestId: 'req-456',
    });
  });
});
