import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaHealthIndicator } from '../src/modules/health/indicators/prisma.health-indicator';
import { RedisHealthIndicator } from '../src/modules/health/indicators/redis.health-indicator';

describe('Health endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const prismaHealthIndicator = {
    ping: jest.fn(),
  };
  const redisHealthIndicator = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    prismaHealthIndicator.ping.mockReset().mockResolvedValue(undefined);
    redisHealthIndicator.ping.mockReset().mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaHealthIndicator)
      .useValue(prismaHealthIndicator)
      .overrideProvider(RedisHealthIndicator)
      .useValue(redisHealthIndicator)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves liveness outside the api prefix and versioning', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body, headers }) => {
        expect(headers['x-request-id']).toBeDefined();
        expect(body).toEqual({
          data: { status: 'ok' },
          meta: {
            requestId: headers['x-request-id'],
            timestamp: expect.any(String),
          },
        });
      });

    await request(app.getHttpServer()).get('/api/health').expect(404);
    await request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });

  it('returns readiness success when all dependencies are healthy', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual({
          status: 'ok',
          checks: {
            database: { status: 'up' },
            redis: { status: 'up' },
          },
        });
      });
  });

  it('returns readiness failure when redis is unavailable', async () => {
    redisHealthIndicator.ping.mockRejectedValueOnce(new Error('Redis is down'));

    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(503)
      .expect(({ body, headers }) => {
        expect(headers['x-request-id']).toBeDefined();
        expect(body).toEqual({
          data: {
            status: 'error',
            checks: {
              database: { status: 'up' },
              redis: {
                status: 'down',
                message: 'Redis is down',
              },
            },
          },
          meta: {
            requestId: headers['x-request-id'],
            timestamp: expect.any(String),
          },
        });
      });
  });
});
