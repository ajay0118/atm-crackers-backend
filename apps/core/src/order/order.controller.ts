import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/order.dto';

@ApiTags('checkout and orders')
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post('checkout/preview')
  @ApiOperation({ summary: 'Validate cart and calculate checkout totals' })
  preview(@Body() dto: CheckoutDto) {
    return this.orderService.preview(dto);
  }
  @Post('orders')
  @ApiOperation({ summary: 'Create a COD order from the cart' })
  create(@Body() dto: CheckoutDto) {
    return this.orderService.create(dto);
  }
  @Get('orders/customer/:mobile')
  @ApiOperation({ summary: 'Get customer order history' })
  byMobile(@Param('mobile') mobile: string) {
    return this.orderService.byMobile(mobile);
  }
  @Get('orders/session')
  @ApiOperation({
    summary: 'Get all orders created in the current cart session',
  })
  session(@Headers('x-cart-key') cartKey: string) {
    return this.orderService.bySession(cartKey);
  }
  @Get('orders/:orderNumber')
  @ApiOperation({ summary: 'Get order details' })
  get(
    @Param('orderNumber') orderNumber: string,
    @Headers('x-cart-key') cartKey: string,
  ) {
    return this.orderService.get(orderNumber, cartKey);
  }
  @Get('orders/:orderNumber/track')
  @ApiOperation({ summary: 'Track an order' })
  track(
    @Param('orderNumber') orderNumber: string,
    @Headers('x-cart-key') cartKey: string,
  ) {
    return this.orderService.track(orderNumber, cartKey);
  }
  @Patch('orders/:orderNumber/cancel')
  @ApiOperation({ summary: 'Cancel a pending order' })
  cancel(
    @Param('orderNumber') orderNumber: string,
    @Headers('x-cart-key') cartKey: string,
  ) {
    return this.orderService.cancel(orderNumber, cartKey);
  }
}
