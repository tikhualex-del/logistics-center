import {
  Controller,
  Get,
  HttpStatus,
  Res,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './indicators/prisma.health-indicator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';

interface HealthCheckDetails {
  status: 'up' | 'down';
  message?: string;
}

interface ReadinessPayload {
  status: 'ok' | 'error';
  checks: {
    database: HealthCheckDetails;
    redis: HealthCheckDetails;
  };
}

@ApiTags('health')
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'The process is running.' })
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({ description: 'All external dependencies are reachable.' })
  @ApiServiceUnavailableResponse({
    description: 'At least one external dependency is unavailable.',
  })
  async readiness(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ReadinessPayload> {
    const [database, redis] = await Promise.all([
      this.checkDependency(() => this.prismaHealthIndicator.ping()),
      this.checkDependency(() => this.redisHealthIndicator.ping()),
    ]);

    const payload: ReadinessPayload = {
      status:
        database.status === 'up' && redis.status === 'up' ? 'ok' : 'error',
      checks: {
        database,
        redis,
      },
    };

    if (payload.status === 'error') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return payload;
  }

  private async checkDependency(
    check: () => Promise<void>,
  ): Promise<HealthCheckDetails> {
    try {
      await check();
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message: getErrorMessage(error),
      };
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Health check failed';
}
