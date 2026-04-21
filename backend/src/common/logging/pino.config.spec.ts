import {
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { NextFunction, Response } from 'express';
import { Writable } from 'node:stream';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { TenantContextMiddleware } from '../../prisma/tenant-context.middleware';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { REQUEST_ID_HEADER } from '../http/request-id';
import { RequestIdInterceptor } from '../interceptors/request-id.interceptor';
import { createLoggerModuleParams } from './pino.config';

class MemoryLogStream extends Writable {
  private readonly lines: string[] = [];

  _write(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.lines.push(chunk.toString());
    callback();
  }

  readJsonLogs(): Array<Record<string, unknown>> {
    return this.lines
      .flatMap((chunk) => chunk.split(/\r?\n/))
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }
}

@Controller('structured-logging-test')
class StructuredLoggingTestController {
  constructor(
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StructuredLoggingTestController.name);
  }

  @Get()
  getLogs(): { ok: true } {
    this.logger.info({ action: 'structured-test' }, 'structured log');
    return { ok: true };
  }
}

describe('Pino logger configuration', () => {
  let app: INestApplication;
  let stream: MemoryLogStream;

  beforeEach(async () => {
    stream = new MemoryLogStream();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(
          createLoggerModuleParams({
            stream,
            level: 'info',
            usePrettyTransport: false,
          }),
        ),
      ],
      controllers: [StructuredLoggingTestController],
      providers: [
        TenantContextService,
        TenantContextMiddleware,
        RequestIdInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: RequestIdInterceptor,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(moduleFixture.get(TenantContextMiddleware).use.bind(
      moduleFixture.get(TenantContextMiddleware),
    ));
    app.use((
      req: { user?: { companyId?: string } },
      _res: Response,
      next: NextFunction,
    ) => {
      req.user = { companyId: 'company-1' };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('includes requestId/companyId/context/message on app logs and HTTP auto logs', async () => {
    await request(app.getHttpServer())
      .get('/structured-logging-test')
      .set(REQUEST_ID_HEADER, 'req-123')
      .expect(200);

    const logs = stream.readJsonLogs();
    const appLog = logs.find((entry) => entry.message === 'structured log');
    const httpLog = logs.find((entry) => entry.message === 'request completed');

    expect(appLog).toEqual(
      expect.objectContaining({
        level: 'info',
        timestamp: expect.any(String),
        requestId: 'req-123',
        companyId: 'company-1',
        context: 'StructuredLoggingTestController',
        action: 'structured-test',
        message: 'structured log',
      }),
    );

    expect(httpLog).toEqual(
      expect.objectContaining({
        level: 'info',
        timestamp: expect.any(String),
        requestId: 'req-123',
        companyId: 'company-1',
        context: 'HTTP',
        message: 'request completed',
      }),
    );
  });
});
