import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '@libs/contracts/order/order.schema';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from './admin-order.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
})
export class AdminOrderModule {}
