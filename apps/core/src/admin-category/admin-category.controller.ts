import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminCategoryService } from './admin-category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: AdminCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ description: 'Category created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid category input' })
  @ApiConflictResponse({ description: 'Category name or slug already exists' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all categories including inactive categories',
  })
  @ApiOkResponse({ description: 'All categories fetched successfully' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one category with product count' })
  @ApiParam({ name: 'id', description: 'Category MongoDB id' })
  @ApiOkResponse({ description: 'Category fetched successfully' })
  @ApiBadRequestResponse({ description: 'Invalid category id' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category details or status' })
  @ApiParam({ name: 'id', description: 'Category MongoDB id' })
  @ApiOkResponse({ description: 'Category updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid category id or input' })
  @ApiConflictResponse({ description: 'Category name or slug already exists' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category with no attached products' })
  @ApiParam({ name: 'id', description: 'Category MongoDB id' })
  @ApiOkResponse({ description: 'Category deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid category id' })
  @ApiConflictResponse({
    description: 'Category cannot be deleted while products are attached',
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin access token',
  })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
