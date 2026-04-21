import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateWebhookRegistrationDto } from './dto/create-webhook-registration.dto';
import { InboundIntegrationOrderDto } from './dto/inbound-integration-order.dto';
import { IntegrationOrderImportResponseDto } from './dto/integration-order-response.dto';
import { UpdateWebhookRegistrationDto } from './dto/update-webhook-registration.dto';
import { WebhookRegistrationResponseDto } from './dto/webhook-registration-response.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin)
@RequirePermission('connect:integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('orders')
  @Public()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key for deduplicating inbound CRM requests',
  })
  @ApiHeader({
    name: 'X-Integration-Name',
    required: true,
    description: 'Configured inbound integration name',
  })
  @ApiHeader({
    name: 'X-Integration-Secret',
    required: true,
    description: 'Configured inbound integration shared secret',
  })
  @ApiCreatedResponse({ type: IntegrationOrderImportResponseDto })
  async importOrder(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-integration-name') integrationName: string | undefined,
    @Headers('x-integration-secret') integrationSecret: string | undefined,
    @Body() dto: InboundIntegrationOrderDto,
  ): Promise<IntegrationOrderImportResponseDto> {
    return await this.integrationsService.importOrder(
      integrationName,
      integrationSecret,
      idempotencyKey,
      dto,
    );
  }

  @Post('webhooks')
  @ApiCreatedResponse({ type: WebhookRegistrationResponseDto })
  async registerWebhook(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWebhookRegistrationDto,
  ): Promise<WebhookRegistrationResponseDto> {
    return await this.integrationsService.registerWebhook(
      companyId,
      userId,
      dto,
    );
  }

  @Get('webhooks')
  @ApiOkResponse({ type: WebhookRegistrationResponseDto, isArray: true })
  async listWebhooks(
    @CurrentUser('companyId') companyId: string,
  ): Promise<WebhookRegistrationResponseDto[]> {
    return await this.integrationsService.listWebhooks(companyId);
  }

  @Patch('webhooks/:id')
  @ApiOkResponse({ type: WebhookRegistrationResponseDto })
  async updateWebhook(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) integrationId: string,
    @Body() dto: UpdateWebhookRegistrationDto,
  ): Promise<WebhookRegistrationResponseDto> {
    return await this.integrationsService.updateWebhook(
      companyId,
      userId,
      integrationId,
      dto,
    );
  }
}
