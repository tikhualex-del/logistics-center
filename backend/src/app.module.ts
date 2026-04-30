import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { basename, resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { createLoggerModuleParams } from './common/logging/pino.config';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { TenantGuard } from './modules/auth/guards/tenant.guard';
import { CompaniesModule } from './modules/companies/companies.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { DispatchersModule } from './modules/dispatchers/dispatchers.module';
import { HealthModule } from './modules/health/health.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlatformModule } from './modules/platform';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RoutingModule } from './modules/routing/routing.module';
import { UsersModule } from './modules/users/users.module';
import { ZonesModule } from './modules/zones/zones.module';
import { PrismaModule } from './prisma/prisma.module';

const cwd = process.cwd();
const isBackendCwd = basename(cwd) === 'backend';
const rootEnvPath = isBackendCwd
  ? resolve(cwd, '..', '.env')
  : resolve(cwd, '.env');
const backendEnvPath = isBackendCwd
  ? resolve(cwd, '.env')
  : resolve(cwd, 'backend', '.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [rootEnvPath, backendEnvPath],
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: buildBullRedisOptions(
          process.env['REDIS_URL'] ?? 'redis://localhost:6379',
        ),
      }),
    }),
    LoggerModule.forRoot(
      createLoggerModuleParams({
        usePrettyTransport: process.env['NODE_ENV'] !== 'production',
      }),
    ),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    AuditModule,
    AuthModule,
    CompaniesModule,
    CompensationModule,
    CouriersModule,
    DispatchersModule,
    HealthModule,
    IntegrationsModule,
    NotificationsModule,
    OrdersModule,
    PlatformModule,
    RealtimeModule,
    RoutingModule,
    UsersModule,
    ZonesModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: AppValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}

function buildBullRedisOptions(redisUrl: string): {
  host: string;
  port: number;
  password?: string;
  db?: number;
} {
  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    ...(parsed.password ? { password: parsed.password } : {}),
    ...(parsed.pathname && parsed.pathname !== '/'
      ? { db: Number(parsed.pathname.slice(1)) }
      : {}),
  };
}
