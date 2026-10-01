import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { mapCategory, mapProduct } from '../catalogue.mapper';
import { FileHelperService } from '../../common/file/file-helper.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly fileHelper: FileHelperService,
  ) {}

  private async categoryResponse(category: any) {
    const value = category.toObject ? category.toObject() : category;
    return mapCategory({
      ...value,
      imageUrl: await this.fileHelper.url(value.imageUrl),
    });
  }

  private async productResponse(product: any) {
    const value = product.toObject ? product.toObject() : product;
    return mapProduct({
      ...value,
      images: await this.fileHelper.urls(value.images),
    });
  }

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
      data: await Promise.all(
        categories.map((category) => this.categoryResponse(category)),
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
      data: await Promise.all(
        products.map((product) => this.productResponse(product)),
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
      data: await this.categoryResponse(category),
    };
  }
}
