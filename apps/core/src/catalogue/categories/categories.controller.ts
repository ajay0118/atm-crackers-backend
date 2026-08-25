import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { mapCategory, mapProduct } from '../catalogue.mapper';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active categories' })
  @ApiResponse({
    status: 200,
    description: 'Active categories fetched successfully',
  })
  async findAll() {
    const categories = await this.categoriesService.findActiveCategories();

    return {
      message: 'Categories fetched successfully',
      count: categories.length,
      data: categories.map((category) =>
        mapCategory(category.toObject() as Parameters<typeof mapCategory>[0]),
      ),
    };
  }

  @Get(':identifier/products')
  @ApiOperation({ summary: 'List active products for a category' })
  @ApiParam({ name: 'identifier', description: 'Category id or slug' })
  @ApiResponse({
    status: 200,
    description: 'Category products fetched successfully',
  })
  async findProducts(@Param('identifier') identifier: string) {
    const products =
      await this.categoriesService.findProductsByCategoryIdentifier(identifier);

    return {
      message: 'Category products fetched successfully',
      count: products.length,
      data: products.map((product) =>
        mapProduct(product.toObject() as Parameters<typeof mapProduct>[0]),
      ),
    };
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get a category by id or slug' })
  @ApiParam({ name: 'identifier', description: 'Category id or slug' })
  @ApiResponse({
    status: 200,
    description: 'Category fetched successfully',
  })
  async findOne(@Param('identifier') identifier: string) {
    const category =
      await this.categoriesService.findActiveCategory(identifier);

    return {
      message: 'Category fetched successfully',
      data: mapCategory(category.toObject()),
    };
  }
}
