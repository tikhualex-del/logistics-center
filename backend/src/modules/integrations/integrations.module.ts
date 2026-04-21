import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrdersModule } from '../orders/orders.module';
import { WEBHOOK_DELIVERY_QUEUE } from './integrations.constants';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { OutboundWebhooksService } from './outbound-webhooks.service';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';

const integrationProviders = [
  IntegrationsService,
  OutboundWebhooksService,
  ...(process.env['NODE_ENV'] === 'test' ? [] : [WebhookDeliveryProcessor]),
];

@Module({
  imports: [
    OrdersModule,
    BullModule.registerQueue({
      name: WEBHOOK_DELIVERY_QUEUE,
    }),
  ],
  controllers: [IntegrationsController],
  providers: integrationProviders,
  exports: [IntegrationsService, OutboundWebhooksService],
})
export class IntegrationsModule {}
