import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentRuleDto } from './dto/create-payment-rule.dto';
import { ListPaymentRulesQueryDto } from './dto/list-payment-rules.query.dto';
import { PaymentRuleResponseDto } from './dto/payment-rule-response.dto';
import { UpdatePaymentRuleDto } from './dto/update-payment-rule.dto';
import { PaymentRulesService } from './payment-rules.service';

@ApiTags('payment-rules')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin)
@RequirePermission('edit:payment-rules')
@Controller('payment-rules')
export class PaymentRulesController {
  constructor(private readonly paymentRulesService: PaymentRulesService) {}

  @Post()
  @ApiCreatedResponse({ type: PaymentRuleResponseDto })
  async createPaymentRule(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentRuleDto,
  ): Promise<PaymentRuleResponseDto> {
    return await this.paymentRulesService.createPaymentRule(companyId, userId, dto);
  }

  @Get()
  @ApiOkResponse({ type: PaymentRuleResponseDto, isArray: true })
  async listPaymentRules(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ListPaymentRulesQueryDto,
  ): Promise<PaymentRuleResponseDto[]> {
    return await this.paymentRulesService.listPaymentRules(companyId, query);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PaymentRuleResponseDto })
  async updatePaymentRule(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) ruleVersionId: string,
    @Body() dto: UpdatePaymentRuleDto,
  ): Promise<PaymentRuleResponseDto> {
    return await this.paymentRulesService.updatePaymentRule(
      companyId,
      userId,
      ruleVersionId,
      dto,
    );
  }
}
