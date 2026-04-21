import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'node:net';

const DEFAULT_REDIS_HOST = '127.0.0.1';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_TIMEOUT_MS = 1000;

interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  timeoutMs: number;
  username?: string;
}

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly configService: ConfigService) {}

  async ping(): Promise<void> {
    const config = this.getConnectionConfig();
    await pingRedis(config);
  }

  private getConnectionConfig(): RedisConnectionConfig {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      const parsed = new URL(redisUrl);

      return {
        host: parsed.hostname || DEFAULT_REDIS_HOST,
        port: parsed.port ? Number(parsed.port) : DEFAULT_REDIS_PORT,
        password: parsed.password || undefined,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        username: parsed.username || undefined,
      };
    }

    const port = Number(
      this.configService.get<string>('REDIS_PORT') ?? DEFAULT_REDIS_PORT,
    );

    return {
      host:
        this.configService.get<string>('REDIS_HOST') ?? DEFAULT_REDIS_HOST,
      port,
      password: this.configService.get<string>('REDIS_PASSWORD') ?? undefined,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      username: this.configService.get<string>('REDIS_USERNAME') ?? undefined,
    };
  }
}

async function pingRedis(config: RedisConnectionConfig): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({
      host: config.host,
      port: config.port,
    });
    let buffer = '';
    let settled = false;

    const cleanup = (): void => {
      socket.removeAllListeners();
      socket.end();
      socket.destroy();
    };

    const fail = (error: Error): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const succeed = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };

    socket.setTimeout(config.timeoutMs);
    socket.once('timeout', () => {
      fail(new Error('Redis health check timed out'));
    });
    socket.once('error', (error) => {
      fail(
        new Error(
          `Redis health check failed: ${error.message || 'Unknown error'}`,
        ),
      );
    });
    socket.once('connect', () => {
      socket.write(buildRedisPingCommand(config));
    });
    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');

      if (
        buffer.includes('-ERR') ||
        buffer.includes('-NOAUTH') ||
        buffer.includes('-WRONGPASS')
      ) {
        fail(new Error(`Redis health check failed: ${buffer.trim()}`));
        return;
      }

      if (buffer.includes('+PONG')) {
        succeed();
      }
    });
  });
}

function buildRedisPingCommand(config: RedisConnectionConfig): string {
  const authArgs = getRedisAuthArgs(config);
  let payload = '';

  if (authArgs.length > 0) {
    payload += serializeRedisCommand('AUTH', ...authArgs);
  }

  payload += serializeRedisCommand('PING');

  return payload;
}

function getRedisAuthArgs(config: RedisConnectionConfig): string[] {
  if (!config.password) {
    return [];
  }

  if (config.username) {
    return [config.username, config.password];
  }

  return [config.password];
}

function serializeRedisCommand(command: string, ...args: string[]): string {
  const values = [command, ...args];
  const header = `*${values.length}\r\n`;
  const body = values
    .map((value) => `$${Buffer.byteLength(value)}\r\n${value}\r\n`)
    .join('');

  return `${header}${body}`;
}
