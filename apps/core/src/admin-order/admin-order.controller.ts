import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminOrderService } from './admin-order.service';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import {
  OrderStatusType,
  PaymentStatusType,
} from '@libs/contracts/order/order.schema';

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: AdminOrderService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter all orders' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search order number, customer name, or mobile',
  })
  @ApiQuery({ name: 'orderStatus', required: false, enum: OrderStatusType })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatusType })
  @ApiOkResponse({ description: 'Admin orders fetched successfully' })
  @ApiBadRequestResponse({ description: 'Invalid filter value' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findAll(@Query() query: OrderListQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get complete order details' })
  @ApiParam({ name: 'orderNumber', example: 'ATM-20260923-0001' })
  @ApiOkResponse({ description: 'Admin order fetched successfully' })
  @ApiBadRequestResponse({ description: 'Order number is required' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findOne(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findOne(orderNumber);
  }

  @Patch(':orderNumber/status')
  @ApiOperation({
    summary: 'Update order status using valid workflow transitions',
  })
  @ApiParam({ name: 'orderNumber', example: 'ATM-20260923-0001' })
  @ApiOkResponse({ description: 'Order status updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid status or status transition' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(orderNumber, dto);
  }

  @Patch(':orderNumber/payment-status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'orderNumber', example: 'ATM-20260923-0001' })
  @ApiOkResponse({ description: 'Payment status updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payment status update' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  updatePaymentStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(orderNumber, dto);
  }

  @Patch(':orderNumber/cancel')
  @ApiOperation({ summary: 'Cancel an order before shipping' })
  @ApiParam({ name: 'orderNumber', example: 'ATM-20260923-0001' })
  @ApiOkResponse({ description: 'Order cancelled successfully' })
  @ApiBadRequestResponse({ description: 'Order cannot be cancelled' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  cancel(@Param('orderNumber') orderNumber: string) {
    return this.orderService.cancel(orderNumber);
  }
}
