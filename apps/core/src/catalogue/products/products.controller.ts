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

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
      data: products.map((product) =>
        mapProduct(product.toObject() as Parameters<typeof mapProduct>[0]),
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
      data: mapProduct(product.toObject()),
    };
  }
}
