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
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, type AuditActorRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('bearer')
@Roles(UserRole.admin, UserRole.dispatcher)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermission('edit:orders')
  @ApiCreatedResponse({ type: OrderResponseDto })
  async createOrder(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.createOrder(companyId, userId, dto);
  }

  @Get()
  @RequirePermission('view:orders')
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async listOrders(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ListOrdersQueryDto,
  ): Promise<OrderResponseDto[]> {
    return await this.ordersService.listOrders(companyId, query);
  }

  @Get(':id')
  @RequirePermission('view:orders')
  @ApiOkResponse({ type: OrderResponseDto })
  async getOrder(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) orderId: string,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.getOrder(companyId, orderId);
  }

  @Patch(':id')
  @RequirePermission('edit:orders')
  @ApiOkResponse({ type: OrderResponseDto })
  async updateOrder(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.updateOrder(
      companyId,
      userId,
      orderId,
      dto,
    );
  }

  @Patch(':id/status')
  @RequirePermission('edit:orders')
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkResponse({ type: OrderResponseDto })
  async updateOrderStatus(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: AuditActorRole,
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.transitionOrderStatus(
      companyId,
      userId,
      actorRole,
      orderId,
      dto,
    );
  }
}
