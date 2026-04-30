import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { getAuthSecret } from './auth.config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { SocketAuthService } from './socket-auth.service';
import { TenantGuard } from './guards/tenant.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { PlatformGuard } from '../platform/guards/platform.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Секрет по умолчанию для access token; refresh использует отдельный секрет
        secret: getAuthSecret(config, 'JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    RolesGuard,
    SocketAuthService,
    TenantGuard,
    PlatformGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    PermissionsGuard,
    PlatformGuard,
    RolesGuard,
    SocketAuthService,
    TenantGuard,
  ],
})
export class AuthModule {}
