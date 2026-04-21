import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { SocketAuthService } from '../auth/socket-auth.service';
import {
  getCompanyRoleRoom,
  getCompanyRoom,
  getCompanyUserRoom,
} from './realtime.constants';
import { RealtimeGateway } from './realtime.gateway';

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

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        { provide: SocketAuthService, useValue: mockSocketAuthService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  it('joins company, role, and user rooms after successful auth', async () => {
    const client = createClient();
    mockSocketAuthService.authenticateSocket.mockResolvedValue({
      id: 'user-1',
      email: 'dispatcher@example.com',
      role: UserRole.dispatcher,
      companyId: 'company-1',
    });

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith(getCompanyRoom('company-1'));
    expect(client.join).toHaveBeenCalledWith(
      getCompanyRoleRoom('company-1', UserRole.dispatcher),
    );
    expect(client.join).toHaveBeenCalledWith(
      getCompanyUserRoom('company-1', 'user-1'),
    );
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects socket when auth fails', async () => {
    const client = createClient();
    mockSocketAuthService.authenticateSocket.mockRejectedValue(
      new Error('Missing access token'),
    );

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('emits to company, role, and user rooms', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = {
      to,
    } as never;

    gateway.emitToCompany('company-1', 'order:status_changed', { orderId: '1' });
    gateway.emitToRole(
      'company-1',
      UserRole.dispatcher,
      'route:updated',
      { routeId: '1' },
    );
    gateway.emitToUser(
      'company-1',
      'user-1',
      'alert:new',
      { alertId: '1' },
    );

    expect(to).toHaveBeenNthCalledWith(1, getCompanyRoom('company-1'));
    expect(to).toHaveBeenNthCalledWith(
      2,
      getCompanyRoleRoom('company-1', UserRole.dispatcher),
    );
    expect(to).toHaveBeenNthCalledWith(
      3,
      getCompanyUserRoom('company-1', 'user-1'),
    );
    expect(emit).toHaveBeenNthCalledWith(1, 'order:status_changed', {
      orderId: '1',
    });
    expect(emit).toHaveBeenNthCalledWith(2, 'route:updated', {
      routeId: '1',
    });
    expect(emit).toHaveBeenNthCalledWith(3, 'alert:new', {
      alertId: '1',
    });
  });
});

function createClient() {
  return {
    id: 'socket-1',
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    data: {},
  };
}
