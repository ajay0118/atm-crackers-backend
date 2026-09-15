import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/order.dto';

@ApiTags('checkout and orders')
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post('checkout/preview') @ApiOperation({ summary: 'Validate cart and calculate checkout totals' }) preview(@Body() dto: CheckoutDto) { return this.orderService.preview(dto); }
  @Post('orders') @ApiOperation({ summary: 'Create a COD order from the cart' }) create(@Body() dto: CheckoutDto) { return this.orderService.create(dto); }
  @Get('orders/customer/:mobile') @ApiOperation({ summary: 'Get customer order history' }) byMobile(@Param('mobile') mobile: string) { return this.orderService.byMobile(mobile); }
  @Get('orders/:orderNumber') @ApiOperation({ summary: 'Get order details' }) get(@Param('orderNumber') orderNumber: string) { return this.orderService.get(orderNumber); }
  @Get('orders/:orderNumber/track') @ApiOperation({ summary: 'Track an order' }) track(@Param('orderNumber') orderNumber: string) { return this.orderService.track(orderNumber); }
  @Patch('orders/:orderNumber/cancel') @ApiOperation({ summary: 'Cancel a pending order' }) cancel(@Param('orderNumber') orderNumber: string) { return this.orderService.cancel(orderNumber); }
}
