import { Module } from '@nestjs/common';
import { ROUTING_PROVIDER } from './providers/routing-provider.interface';
import { YandexRoutingProvider } from './providers/yandex-routing.provider';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';

@Module({
  controllers: [RoutingController],
  providers: [
    RoutingService,
    YandexRoutingProvider,
    {
      provide: ROUTING_PROVIDER,
      useExisting: YandexRoutingProvider,
    },
  ],
  exports: [RoutingService, ROUTING_PROVIDER, YandexRoutingProvider],
})
export class RoutingModule {}
