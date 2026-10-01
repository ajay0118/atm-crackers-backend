import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductListQueryDto } from '../dto/product-list-query.dto';
import { ProductsService } from './products.service';
import { mapProduct } from '../catalogue.mapper';
import { FileHelperService } from '../../common/file/file-helper.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly fileHelper: FileHelperService,
  ) {}

  private async productResponse(product: any) {
    const value = product.toObject ? product.toObject() : product;
    return mapProduct({
      ...value,
      images: await this.fileHelper.urls(value.images),
    });
  }

  @Get()
  @ApiOperation({ summary: 'List active products' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by product name, slug, or description',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category id or slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Active products fetched successfully',
  })
  async findAll(@Query() query: ProductListQueryDto) {
    const products = await this.productsService.findAll(
      query.search,
      query.category,
    );

    return {
      message: 'Products fetched successfully',
      count: products.length,
      data: await Promise.all(
        products.map((product) => this.productResponse(product)),
      ),
    };
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get a product by id or slug' })
  @ApiParam({ name: 'identifier', description: 'Product id or slug' })
  @ApiResponse({
    status: 200,
    description: 'Product fetched successfully',
  })
  async findOne(@Param('identifier') identifier: string) {
    const product = await this.productsService.findOne(identifier);

    return {
      message: 'Product fetched successfully',
      data: await this.productResponse(product),
    };
  }
}
