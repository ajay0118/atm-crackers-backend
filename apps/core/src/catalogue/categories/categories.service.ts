import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '@libs/contracts/category/category.schema';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { buildIdentifierFilter } from '../catalogue.utils';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findActiveCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  async findActiveCategory(identifier: string): Promise<CategoryDocument> {
    const trimmed = identifier.trim();

    if (!trimmed) {
      throw new BadRequestException('Category identifier is required');
    }

    const category = await this.categoryModel.findOne({
      ...buildIdentifierFilter(trimmed),
      isActive: true,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findProductsByCategoryIdentifier(
    identifier: string,
  ): Promise<ProductDocument[]> {
    const category = await this.findActiveCategory(identifier);

    return this.productModel
      .find({
        category: category._id,
        isActive: true,
      })
      .sort({ displayOrder: 1, name: 1 })
      .populate('category')
      .exec();
  }
}
