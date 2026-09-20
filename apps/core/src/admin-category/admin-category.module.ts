import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Category,
  CategorySchema,
} from '@libs/contracts/category/category.schema';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService],
})
export class AdminCategoryModule {}
