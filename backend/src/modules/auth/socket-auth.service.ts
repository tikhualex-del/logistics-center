import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Socket } from 'socket.io';
import type { AuthenticatedUser } from './auth-request.types';
import { getAuthSecret } from './auth.config';
import { AuthService, type JwtPayload } from './auth.service';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async authenticateSocket(
    client: Socket,
    allowedRoles?: readonly UserRole[],
  ): Promise<AuthenticatedUser> {
    const token = extractAccessToken(client);
    if (!token) {
      throw new Error('Missing access token');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: getAuthSecret(this.config, 'JWT_SECRET'),
    });
    const user = await this.authService.validateUser(
      payload.sub,
      payload.companyId,
    );

    if (!user) {
      throw new Error('User not found or disabled');
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new Error(`Role ${user.role} is not allowed for this socket`);
    }

    return user;
  }
}

function extractAccessToken(client: Socket): string | null {
  const handshakeAuth = client.handshake.auth as
    | Record<string, unknown>
    | undefined;
  const authToken = handshakeAuth?.['token'];
  if (typeof authToken === 'string') {
    return normalizeAccessToken(authToken);
  }

  const authorizationHeader = client.handshake.headers['authorization'];
  if (typeof authorizationHeader === 'string') {
    return normalizeAccessToken(authorizationHeader);
  }

  return null;
}

function normalizeAccessToken(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.startsWith('Bearer ')
    ? normalized.slice('Bearer '.length).trim() || null
    : normalized;
}
