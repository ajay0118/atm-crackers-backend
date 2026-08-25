import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { CategoriesService } from '../categories/categories.service';
import { escapeRegExp } from '../catalogue.utils';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(
    search?: string,
    categoryIdentifier?: string,
  ): Promise<ProductDocument[]> {
    const query = this.productModel.find().where('isActive').equals(true);

    if (search?.trim()) {
      const safeSearch = escapeRegExp(search.trim());
      query.or([
        { name: { $regex: safeSearch, $options: 'i' } },
        { slug: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ]);
    }

    if (categoryIdentifier?.trim()) {
      const category =
        await this.categoriesService.findActiveCategory(categoryIdentifier);
      query.where('category').equals(category._id);
    }

    const products = await query
      .sort({ displayOrder: 1, name: 1 })
      .populate('category')
      .exec();

    return products.filter((product) => {
      const category = product.category as { isActive?: boolean } | undefined;
      return Boolean(category?.isActive !== false);
    });
  }

  async findOne(identifier: string): Promise<ProductDocument> {
    const trimmed = identifier.trim();

    if (!trimmed) {
      throw new BadRequestException('Product identifier is required');
    }

    const product = await this.productModel
      .findOne({
        $or: [
          { slug: trimmed },
          ...(trimmed.match(/^[a-f\d]{24}$/i) ? [{ _id: trimmed }] : []),
        ],
        isActive: true,
      })
      .populate('category')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const category = product.category as { isActive?: boolean } | undefined;
    if (!category?.isActive) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
