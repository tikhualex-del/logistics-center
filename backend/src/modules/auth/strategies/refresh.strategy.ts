import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getAuthSecret } from '../auth.config';
import type { RefreshJwtPayload } from '../auth.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = (request?.cookies as Record<string, string> | undefined)?.[
            'refreshToken'
          ];
          if (!token) {
            throw new UnauthorizedException('Refresh token not provided');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: getAuthSecret(config, 'JWT_REFRESH_SECRET'),
      passReqToCallback: false,
    });
  }

  validate(payload: RefreshJwtPayload): RefreshJwtPayload {
    if (!payload.sub || !payload.companyId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    return payload;
  }
}
