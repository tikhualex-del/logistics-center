import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health-indicator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaHealthIndicator: jest.Mocked<PrismaHealthIndicator>;
  let redisHealthIndicator: jest.Mocked<RedisHealthIndicator>;

  beforeEach(() => {
    prismaHealthIndicator = {
      ping: jest.fn(),
    } as unknown as jest.Mocked<PrismaHealthIndicator>;
    redisHealthIndicator = {
      ping: jest.fn(),
    } as unknown as jest.Mocked<RedisHealthIndicator>;

    controller = new HealthController(
      prismaHealthIndicator,
      redisHealthIndicator,
    );
  });

  it('returns ok for liveness', () => {
    expect(controller.liveness()).toEqual({ status: 'ok' });
  });

  it('returns readiness success when database and redis are healthy', async () => {
    prismaHealthIndicator.ping.mockResolvedValue(undefined);
    redisHealthIndicator.ping.mockResolvedValue(undefined);

    const response = createResponseStub() as Response;

    await expect(controller.readiness(response)).resolves.toEqual({
      status: 'ok',
      checks: {
        database: { status: 'up' },
        redis: { status: 'up' },
      },
    });
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns readiness failure and 503 when redis is unavailable', async () => {
    prismaHealthIndicator.ping.mockResolvedValue(undefined);
    redisHealthIndicator.ping.mockRejectedValue(new Error('Redis is down'));

    const response = createResponseStub() as Response;

    await expect(controller.readiness(response)).resolves.toEqual({
      status: 'error',
      checks: {
        database: { status: 'up' },
        redis: {
          status: 'down',
          message: 'Redis is down',
        },
      },
    });
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });
});

function createResponseStub(): Pick<Response, 'status'> {
  return {
    status: jest.fn(),
  };
}
