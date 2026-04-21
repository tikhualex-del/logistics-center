import { PartialType } from '@nestjs/swagger';
import { CreatePaymentRuleDto } from './create-payment-rule.dto';

export class UpdatePaymentRuleDto extends PartialType(CreatePaymentRuleDto) {}
