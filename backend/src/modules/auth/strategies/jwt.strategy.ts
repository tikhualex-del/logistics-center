import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../auth-request.types';
import { getAuthSecret } from '../auth.config';
import { AuthService, type JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getAuthSecret(config, 'JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type === 'platform') {
      const admin = await this.authService.validatePlatformAdmin(payload.sub);

      if (!admin) {
        throw new UnauthorizedException('Platform admin not found or disabled');
      }

      return admin;
    }

    if (payload.type === 'impersonation') {
      if (!payload.companyId || !payload.sessionId) {
        throw new UnauthorizedException('Invalid impersonation token payload');
      }

      const user = await this.authService.validateImpersonationSession(
        payload.sub,
        payload.sessionId,
        payload.companyId,
      );

      if (!user) {
        throw new UnauthorizedException(
          'Impersonation session not found or expired',
        );
      }

      return user;
    }

    if (!payload.companyId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.authService.validateUser(
      payload.sub,
      payload.companyId,
    );

    if (!user) {
      throw new UnauthorizedException('User not found or disabled');
    }

    return user;
  }
}
