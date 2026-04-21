import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { SocketAuthService } from '../auth/socket-auth.service';
import {
  getAdminNotificationsRoom,
  getDispatcherNotificationsRoom,
  NOTIFICATION_EVENT,
} from './notifications.constants';
import { NotificationsGateway } from './notifications.gateway';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockSocketAuthService = {
  authenticateSocket: jest.fn(),
};

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: SocketAuthService, useValue: mockSocketAuthService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('accepts dispatcher sockets and joins dispatcher room', async () => {
    const client = createClient({
      auth: { token: 'dispatcher-token' },
    });
    mockSocketAuthService.authenticateSocket.mockResolvedValue({
      id: 'user-1',
      email: 'dispatcher@example.com',
      role: UserRole.dispatcher,
      companyId: 'company-1',
    });

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith(
      'company:company-1:notifications',
    );
    expect(client.join).toHaveBeenCalledWith(
      getDispatcherNotificationsRoom('company-1'),
    );
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        role: UserRole.dispatcher,
      }),
    );
  });

  it('accepts admin sockets from authorization header', async () => {
    const client = createClient({
      headers: { authorization: 'Bearer admin-token' },
    });
    mockSocketAuthService.authenticateSocket.mockResolvedValue({
      id: 'user-2',
      email: 'admin@example.com',
      role: UserRole.admin,
      companyId: 'company-1',
    });

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith(
      getAdminNotificationsRoom('company-1'),
    );
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects sockets without access token', async () => {
    const client = createClient();
    mockSocketAuthService.authenticateSocket.mockRejectedValue(
      new Error('Missing access token'),
    );

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects roles outside dispatcher/admin', async () => {
    const client = createClient({
      auth: { token: 'courier-token' },
    });
    mockSocketAuthService.authenticateSocket.mockRejectedValue(
      new Error('Role courier is not allowed for this socket'),
    );

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('broadcasts notifications to dispatcher room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = {
      to,
    } as never;

    gateway.broadcastToDispatchers('company-1', {
      id: 'notification-1',
      type: 'new-order',
      companyId: 'company-1',
      entityType: 'order',
      entityId: 'order-1',
      title: 'New order',
      message: 'Order ORD-1 is ready for dispatch',
      createdAt: '2026-04-17T12:00:00.000Z',
      data: {},
    });

    expect(to).toHaveBeenCalledWith(
      getDispatcherNotificationsRoom('company-1'),
    );
    expect(emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENT,
      expect.objectContaining({
        id: 'notification-1',
        type: 'new-order',
      }),
    );
  });
});

function createClient(options?: {
  auth?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}): {
  id: string;
  handshake: {
    auth: Record<string, unknown>;
    headers: Record<string, unknown>;
  };
  join: jest.Mock<Promise<void>, [string]>;
  disconnect: jest.Mock<void, [boolean?]>;
  data: {
    user?: {
      id: string;
      email: string;
      role: UserRole;
      companyId: string;
    };
  };
} {
  return {
    id: 'socket-1',
    handshake: {
      auth: options?.auth ?? {},
      headers: options?.headers ?? {},
    },
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    data: {},
  };
}
