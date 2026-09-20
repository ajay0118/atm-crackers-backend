import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '@libs/contracts/category/category.schema';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { CommonStatusType } from '@libs/contracts/enums/common.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeSlug(value: string) {
    const slug = this.slugify(value);
    if (!slug) throw new ConflictException('A valid category slug is required');
    return slug;
  }

  private async ensureUnique(
    name: string | undefined,
    slug: string,
    excludeId?: string,
  ) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    if (await this.categoryModel.exists(query))
      throw new ConflictException('A category with this slug already exists');

    if (name) {
      const nameQuery: Record<string, unknown> = {
        name: {
          $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          $options: 'i',
        },
      };
      if (excludeId) nameQuery._id = { $ne: excludeId };
      if (await this.categoryModel.exists(nameQuery))
        throw new ConflictException('A category with this name already exists');
    }
  }

  private async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category id');
    }
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private async withProductCount(category: CategoryDocument) {
    const productCount = await this.productModel
      .countDocuments({ category: category._id })
      .exec();
    return { ...category.toObject(), productCount };
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.normalizeSlug(dto.slug || dto.name);
    await this.ensureUnique(dto.name, slug);
    const category = await this.categoryModel.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || '',
      imageUrl: dto.imageUrl?.trim() || '',
      displayOrder: dto.displayOrder ?? 0,
      status: dto.status ?? CommonStatusType.ACTIVE,
    });
    return {
      message: 'Category created successfully',
      data: await this.withProductCount(category),
    };
  }

  async findAll() {
    const categories = await this.categoryModel
      .find()
      .sort({ displayOrder: 1, name: 1 })
      .exec();
    const data = await Promise.all(
      categories.map((category) => this.withProductCount(category)),
    );
    return {
      message: 'Admin categories fetched successfully',
      count: data.length,
      data,
    };
  }

  async findOne(id: string) {
    return {
      message: 'Category fetched successfully',
      data: await this.withProductCount(await this.findById(id)),
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one category field is required');
    }
    const category = await this.findById(id);
    const nextName = dto.name?.trim() || category.name;
    const nextSlug = dto.slug ? this.normalizeSlug(dto.slug) : category.slug;
    await this.ensureUnique(nextName, nextSlug, id);
    Object.assign(category, {
      name: nextName,
      slug: nextSlug,
      ...(dto.description !== undefined && {
        description: dto.description.trim(),
      }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl.trim() }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.status !== undefined && { status: dto.status }),
    });
    await category.save();
    return {
      message: 'Category updated successfully',
      data: await this.withProductCount(category),
    };
  }

  async remove(id: string) {
    const category = await this.findById(id);
    const productCount = await this.productModel
      .countDocuments({ category: category._id })
      .exec();
    if (productCount > 0) {
      throw new ConflictException(
        `Category cannot be deleted because ${productCount} product(s) are attached. Deactivate it instead.`,
      );
    }
    await category.deleteOne();
    return { message: 'Category deleted successfully' };
  }
}
