import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from '@libs/contracts/offer/offer.schema';
import {
  CommonStatusType,
  OfferScopeType,
} from '@libs/contracts/enums/common.enum';
import { calculateSellingPrice } from '../catalogue/catalogue.utils';

@Injectable()
export class OfferPricingService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
  ) {}

  async price(product: {
    _id: Types.ObjectId;
    mrp: number;
    discountPercent: number;
    category?: unknown;
  }) {
    const now = new Date();
    const categoryId = (
      product.category as { _id?: Types.ObjectId } | undefined
    )?._id;
    const base = {
      status: CommonStatusType.ACTIVE,
      startAt: { $lte: now },
      expiresAt: { $gte: now },
    };
    const offer =
      (await this.offerModel
        .findOne({
          ...base,
          scope: OfferScopeType.PRODUCT,
          productIds: product._id,
        })
        .sort({ createdAt: -1 })
        .exec()) ??
      (categoryId
        ? await this.offerModel
            .findOne({
              ...base,
              scope: OfferScopeType.CATEGORY,
              categoryIds: categoryId,
            })
            .sort({ createdAt: -1 })
            .exec()
        : null) ??
      (await this.offerModel
        .findOne({ ...base, scope: OfferScopeType.GLOBAL })
        .sort({ createdAt: -1 })
        .exec());
    const discountPercent = offer?.discountPercent ?? product.discountPercent;
    return {
      discountPercent,
      sellingPrice: calculateSellingPrice(product.mrp, discountPercent),
      offer: offer
        ? { id: offer._id.toString(), name: offer.name, scope: offer.scope }
        : null,
    };
  }
}
