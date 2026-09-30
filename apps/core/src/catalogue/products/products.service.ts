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
import { CommonStatusType } from '@libs/contracts/enums/common.enum';
import { OfferPricingService } from '../../offer/offer-pricing.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly offerPricingService: OfferPricingService,
  ) {}

  async findAll(
    search?: string,
    categoryIdentifier?: string,
  ): Promise<ProductDocument[]> {
    const query = this.productModel
      .find()
      .where('status')
      .equals(CommonStatusType.ACTIVE);

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

    return Promise.all(
      products
        .filter((product) => {
          const category = product.category as { status?: string } | undefined;
          return Boolean(category?.status !== CommonStatusType.INACTIVE);
        })
        .map(async (product) => {
          const pricing = await this.offerPricingService.price(product);
          product.discountPercent = pricing.discountPercent;
          product.sellingPrice = pricing.sellingPrice;
          return product;
        }),
    );
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
        status: CommonStatusType.ACTIVE,
      })
      .populate('category')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const category = product.category as { status?: string } | undefined;
    if (category?.status !== CommonStatusType.ACTIVE) {
      throw new NotFoundException('Product not found');
    }

    const pricing = await this.offerPricingService.price(product);
    product.discountPercent = pricing.discountPercent;
    product.sellingPrice = pricing.sellingPrice;
    return product;
  }
}
