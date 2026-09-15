import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '@libs/contracts/cart/cart.schema';
import {
  Category,
  CategorySchema,
} from '@libs/contracts/category/category.schema';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
