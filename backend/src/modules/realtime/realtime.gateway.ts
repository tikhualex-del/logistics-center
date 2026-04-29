import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedUser } from '../auth/auth-request.types';
import { SocketAuthService } from '../auth/socket-auth.service';
import {
  getCompanyRoleRoom,
  getCompanyRoom,
  getCompanyUserRoom,
  REALTIME_NAMESPACE,
} from './realtime.constants';

@Injectable()
@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RealtimeGateway.name);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.socketAuth.authenticateSocket(client, [
        UserRole.admin,
        UserRole.dispatcher,
        UserRole.courier,
      ]);
      setSocketUser(client, user);

      await client.join(getCompanyRoom(user.companyId));
      await client.join(getCompanyRoleRoom(user.companyId, user.role));
      await client.join(getCompanyUserRoom(user.companyId, user.id));

      this.logger.info(
        {
          socketId: client.id,
          userId: user.id,
          companyId: user.companyId,
          role: user.role,
        },
        'Realtime socket connected',
      );
    } catch (error) {
      this.logger.warn(
        {
          socketId: client.id,
          error,
        },
        'Realtime socket rejected',
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = getSocketUser(client);

    this.logger.info(
      {
        socketId: client.id,
        userId: user?.id ?? null,
        companyId: user?.companyId ?? null,
      },
      'Realtime socket disconnected',
    );
  }

  emitToCompany(companyId: string, event: string, payload: unknown): void {
    this.server.to(getCompanyRoom(companyId)).emit(event, payload);
  }

  emitToRole(
    companyId: string,
    role: UserRole,
    event: string,
    payload: unknown,
  ): void {
    this.server.to(getCompanyRoleRoom(companyId, role)).emit(event, payload);
  }

  emitToUser(
    companyId: string,
    userId: string,
    event: string,
    payload: unknown,
  ): void {
    this.server.to(getCompanyUserRoom(companyId, userId)).emit(event, payload);
  }
}

function setSocketUser(client: Socket, user: AuthenticatedUser): void {
  const socketData = client.data as { user?: AuthenticatedUser };
  socketData.user = user;
}

function getSocketUser(client: Socket): AuthenticatedUser | undefined {
  const socketData = client.data as { user?: AuthenticatedUser };
  return socketData.user;
}
