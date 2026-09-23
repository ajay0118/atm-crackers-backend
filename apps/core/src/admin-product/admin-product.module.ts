import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Category,
  CategorySchema,
} from '@libs/contracts/category/category.schema';
import { Order, OrderSchema } from '@libs/contracts/order/order.schema';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';
import { AdminProductController } from './admin-product.controller';
import { AdminProductService } from './admin-product.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [AdminProductController],
  providers: [AdminProductService],
})
export class AdminProductModule {}
