import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { CatalogueSeedService } from './catalogue-seed.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import {
  Category,
  CategorySchema,
} from '@libs/contracts/category/category.schema';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CategoriesController, ProductsController],
  providers: [CategoriesService, ProductsService, CatalogueSeedService],
  exports: [CategoriesService, ProductsService],
})
export class CatalogueModule {}
