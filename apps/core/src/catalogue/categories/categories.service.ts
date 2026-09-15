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
import { CommonStatusType } from '@libs/contracts/enums/common.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findActiveCategories(): Promise<any[]> {
    return this.categoryModel
      .aggregate([
        { $match: { status: CommonStatusType.ACTIVE } },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$category', '$$categoryId'] },
                  status: CommonStatusType.ACTIVE,
                },
              },
              { $count: 'count' },
            ],
            as: 'productStats',
          },
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [{ $arrayElemAt: ['$productStats.count', 0] }, 0],
            },
          },
        },
        { $project: { productStats: 0 } },
        { $sort: { displayOrder: 1, name: 1 } },
      ])
      .exec();
  }

  async findActiveCategory(identifier: string): Promise<CategoryDocument> {
    const trimmed = identifier.trim();

    if (!trimmed) {
      throw new BadRequestException('Category identifier is required');
    }

    const category = await this.categoryModel.findOne({
      ...buildIdentifierFilter(trimmed),
      status: CommonStatusType.ACTIVE,
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
        status: CommonStatusType.ACTIVE,
      })
      .sort({ displayOrder: 1, name: 1 })
      .populate('category')
      .exec();
  }
}
