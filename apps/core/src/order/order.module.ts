import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '@libs/contracts/cart/cart.schema';
import {
  Category,
  CategorySchema,
} from '@libs/contracts/category/category.schema';
import {
  Customer,
  CustomerSchema,
} from '@libs/contracts/customer/customer.schema';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';
import { Order, OrderSchema } from '@libs/contracts/order/order.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
