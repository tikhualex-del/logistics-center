import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedUser } from '../auth/auth-request.types';
import { SocketAuthService } from '../auth/socket-auth.service';
import {
  getAdminNotificationsRoom,
  getCompanyNotificationsRoom,
  getDispatcherNotificationsRoom,
  NOTIFICATION_EVENT,
  NOTIFICATIONS_NAMESPACE,
} from './notifications.constants';
import type { WebNotificationEnvelope } from './notifications.types';

type SocketWithUser = Socket & {
  data: {
    user?: AuthenticatedUser;
  };
};

@Injectable()
@WebSocketGateway({
  namespace: NOTIFICATIONS_NAMESPACE,
  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.socketAuth.authenticateSocket(client, [
        UserRole.admin,
        UserRole.dispatcher,
      ]);

      const socket = client as SocketWithUser;
      socket.data.user = user;

      await client.join(getCompanyNotificationsRoom(user.companyId));
      await client.join(
        user.role === UserRole.dispatcher
          ? getDispatcherNotificationsRoom(user.companyId)
          : getAdminNotificationsRoom(user.companyId),
      );

      this.logger.info(
        {
          socketId: client.id,
          userId: user.id,
          companyId: user.companyId,
          role: user.role,
        },
        'Notifications socket connected',
      );
    } catch (error) {
      this.disconnectUnauthorized(client, 'Invalid access token', error);
    }
  }

  broadcastToDispatchers(
    companyId: string,
    notification: WebNotificationEnvelope,
  ): void {
    if (!this.server) {
      this.logger.warn(
        {
          companyId,
          notificationType: notification.type,
        },
        'Notifications server is not ready yet',
      );
      return;
    }

    this.server
      .to(getDispatcherNotificationsRoom(companyId))
      .emit(NOTIFICATION_EVENT, notification);
  }

  private disconnectUnauthorized(
    client: Socket,
    reason: string,
    error?: unknown,
  ): void {
    this.logger.warn(
      {
        socketId: client.id,
        reason,
        error,
      },
      'Notifications socket rejected',
    );
    client.disconnect(true);
  }
}
