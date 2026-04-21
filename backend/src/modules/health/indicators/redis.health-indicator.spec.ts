jest.mock('node:net', () => ({
  createConnection: jest.fn(),
}));

import { EventEmitter } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'node:net';
import { RedisHealthIndicator } from './redis.health-indicator';

class MockSocket extends EventEmitter {
  public readonly setTimeout = jest.fn();
  public readonly write = jest.fn();
  public readonly end = jest.fn();
  public readonly destroy = jest.fn();
}

describe('RedisHealthIndicator', () => {
  const createConnectionMock = jest.mocked(createConnection);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pings redis via REDIS_URL', async () => {
    const socket = new MockSocket();
    createConnectionMock.mockReturnValue(socket as never);

    const indicator = new RedisHealthIndicator({
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') {
          return 'redis://localhost:6379';
        }

        return undefined;
      }),
    } as unknown as ConfigService);

    const pingPromise = indicator.ping();

    socket.emit('connect');
    expect(socket.write).toHaveBeenCalledWith('*1\r\n$4\r\nPING\r\n');

    socket.emit('data', Buffer.from('+PONG\r\n'));

    await expect(pingPromise).resolves.toBeUndefined();
    expect(createConnectionMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
    });
    expect(socket.setTimeout).toHaveBeenCalledWith(1000);
  });

  it('fails when redis rejects the probe', async () => {
    const socket = new MockSocket();
    createConnectionMock.mockReturnValue(socket as never);

    const indicator = new RedisHealthIndicator({
      get: jest.fn((key: string) => {
        if (key === 'REDIS_HOST') {
          return '127.0.0.1';
        }
        if (key === 'REDIS_PORT') {
          return '6379';
        }

        return undefined;
      }),
    } as unknown as ConfigService);

    const pingPromise = indicator.ping();

    socket.emit('connect');
    socket.emit('data', Buffer.from('-ERR invalid password\r\n'));

    await expect(pingPromise).rejects.toThrow(
      'Redis health check failed: -ERR invalid password',
    );
  });
});
