import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminProductService } from './admin-product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('admin-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly productService: AdminProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ description: 'Product created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid product or category data' })
  @ApiConflictResponse({
    description: 'Product slug already exists in this category',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all products with optional search and filters',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search name, slug, or description',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category id',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({
    name: 'stockStatus',
    required: false,
    enum: ['in_stock', 'limited', 'out_of_stock'],
  })
  @ApiOkResponse({ description: 'Admin products fetched successfully' })
  @ApiBadRequestResponse({ description: 'Invalid filter value' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findAll(@Query() query: ProductListQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one product' })
  @ApiParam({ name: 'id', description: 'Product MongoDB id' })
  @ApiOkResponse({ description: 'Product fetched successfully' })
  @ApiBadRequestResponse({ description: 'Invalid product id' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product details, pricing, stock, or status',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB id' })
  @ApiOkResponse({ description: 'Product updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid product id or input' })
  @ApiConflictResponse({
    description: 'Product slug already exists in this category',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product not referenced by orders' })
  @ApiParam({ name: 'id', description: 'Product MongoDB id' })
  @ApiOkResponse({ description: 'Product deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid product id' })
  @ApiConflictResponse({
    description:
      'Product is referenced by existing orders; deactivate it instead',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
