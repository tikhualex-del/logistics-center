import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PAYMENT_CALCULATION_QUEUE } from './compensation.constants';
import { PaymentCalculationProcessor } from './payment-calculation.processor';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRulesController } from './payment-rules.controller';
import { PaymentRulesService } from './payment-rules.service';

const compensationProviders = [
  PaymentRulesService,
  PaymentsService,
  ...(process.env['NODE_ENV'] === 'test' ? [] : [PaymentCalculationProcessor]),
];

@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_CALCULATION_QUEUE,
    }),
  ],
  controllers: [PaymentRulesController, PaymentsController],
  providers: compensationProviders,
  exports: [PaymentRulesService, PaymentsService],
})
export class CompensationModule {}
