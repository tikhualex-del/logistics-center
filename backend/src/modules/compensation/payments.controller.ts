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
import { CalculatePaymentDto } from './dto/calculate-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments.query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin)
@RequirePermission('edit:payment-rules')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  async listPayments(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ListPaymentsQueryDto,
  ): Promise<PaymentResponseDto[]> {
    return await this.paymentsService.listPayments(companyId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: PaymentResponseDto })
  async getPayment(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) paymentId: string,
  ): Promise<PaymentResponseDto> {
    return await this.paymentsService.getPayment(companyId, paymentId);
  }

  @Post('calculate')
  @ApiCreatedResponse({ type: PaymentResponseDto })
  async calculatePayment(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CalculatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentsService.calculatePayment(companyId, userId, dto);
  }

  @Patch(':id/status')
  @RequirePermission('approve:motivation-rules')
  @ApiOkResponse({ type: PaymentResponseDto })
  async updatePaymentStatus(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) paymentId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentsService.updatePaymentStatus(
      companyId,
      userId,
      paymentId,
      dto,
    );
  }
}
