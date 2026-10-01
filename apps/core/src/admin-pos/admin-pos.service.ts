import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { Category } from '@libs/contracts/category/category.schema';
import { Coupon, CouponDocument } from '@libs/contracts/coupon/coupon.schema';
import {
  CouponDiscountType,
  CouponStatus,
} from '@libs/contracts/enums/common.enum';
import {
  PosBill,
  PosBillDocument,
} from '@libs/contracts/pos-bill/pos-bill.schema';
import {
  CommonStatusType,
  PosBillStatusType,
  PosPaymentMethodType,
  PosPaymentStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import { OfferPricingService } from '../offer/offer-pricing.service';
import { PosBillDto, PosListQueryDto } from './dto/pos.dto';

@Injectable()
export class AdminPosService {
  constructor(
    @InjectModel(PosBill.name)
    private readonly billModel: Model<PosBillDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    private readonly offerPricing: OfferPricingService,
  ) {}

  private async calculate(dto: PosBillDto) {
    if (!dto.items.length)
      throw new BadRequestException('At least one product is required');
    const items: any[] = [];
    for (const input of dto.items) {
      if (!Types.ObjectId.isValid(input.productId))
        throw new BadRequestException('Invalid product ID');
      const product = await this.productModel
        .findOne({ _id: input.productId, status: CommonStatusType.ACTIVE })
        .populate('category')
        .exec();
      if (!product) throw new NotFoundException('Active product not found');
      const category = product.category as Category & { _id: Types.ObjectId };
      if (!category || category.status !== CommonStatusType.ACTIVE)
        throw new BadRequestException('Product category is not active');
      if (
        product.stockStatus === StockStatusType.OUT_OF_STOCK ||
        (product.stockQuantity !== undefined &&
          input.quantity > product.stockQuantity)
      )
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      const pricing = await this.offerPricing.price(product);
      items.push({
        productId: product._id,
        categoryId: category._id,
        productName: product.name,
        categoryName: category.name,
        image: product.images[0] ?? '',
        quantity: input.quantity,
        mrp: product.mrp,
        sellingPrice: pricing.sellingPrice,
        discountPercent: pricing.discountPercent,
        offerId: pricing.offer?.id ?? null,
        offerName: pricing.offer?.name ?? null,
        itemTotal: pricing.sellingPrice * input.quantity,
      });
    }
    const subtotal = items.reduce(
      (sum, item) => sum + item.mrp * item.quantity,
      0,
    );
    const itemTotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    let couponDiscount = 0;
    const couponCode = dto.couponCode?.trim().toUpperCase() || null;
    if (couponCode) {
      const coupon = await this.couponModel
        .findOne({ code: couponCode, status: CouponStatus.ACTIVE })
        .exec();
      if (
        !coupon ||
        new Date() < coupon.startAt ||
        new Date() > coupon.expiresAt
      )
        throw new BadRequestException('Invalid or expired coupon');
      if (itemTotal < coupon.minimumOrderValue)
        throw new BadRequestException(
          `Minimum order value for this coupon is ${coupon.minimumOrderValue}`,
        );
      couponDiscount =
        coupon.discountType === CouponDiscountType.PERCENTAGE
          ? (itemTotal * coupon.discountValue) / 100
          : coupon.discountValue;
      if (coupon.maximumDiscount != null)
        couponDiscount = Math.min(couponDiscount, coupon.maximumDiscount);
      couponDiscount = Math.min(couponDiscount, itemTotal);
    }
    return {
      items,
      subtotal,
      couponCode,
      couponDiscount,
      totalDiscount: subtotal - itemTotal + couponDiscount,
      grandTotal: itemTotal - couponDiscount,
    };
  }

  async products(search?: string, categoryId?: string) {
    const filter: Record<string, unknown> = { status: CommonStatusType.ACTIVE };
    if (categoryId) filter.category = categoryId;
    if (search?.trim())
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
      ];
    const products = await this.productModel
      .find(filter)
      .populate('category')
      .sort({ displayOrder: 1, name: 1 })
      .exec();
    return {
      message: 'POS products fetched successfully',
      count: products.length,
      data: await Promise.all(
        products.map(async (product) => {
          const pricing = await this.offerPricing.price(product);
          return {
            id: product._id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            images: product.images,
            mrp: product.mrp,
            discountPercent: pricing.discountPercent,
            sellingPrice: pricing.sellingPrice,
            stockQuantity: product.stockQuantity,
            stockStatus: product.stockStatus,
          };
        }),
      ),
    };
  }

  async preview(dto: PosBillDto) {
    const data = await this.calculate(dto);
    return { message: 'POS bill preview calculated successfully', data };
  }

  async create(dto: PosBillDto, adminId: string) {
    const calculated = await this.calculate(dto);
    const deducted: Array<{ productId: Types.ObjectId; quantity: number }> = [];
    let couponReserved = false;
    try {
      for (const item of calculated.items) {
        const result = await this.productModel
          .updateOne(
            { _id: item.productId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } },
          )
          .exec();
        if (!result.modifiedCount)
          throw new BadRequestException(
            `Insufficient stock for ${item.productName}`,
          );
        deducted.push({ productId: item.productId, quantity: item.quantity });
        await this.refreshStockStatus(item.productId);
      }
      const paymentStatus =
        dto.paymentStatus ??
        (dto.paymentMethod === PosPaymentMethodType.CREDIT
          ? PosPaymentStatusType.PENDING
          : PosPaymentStatusType.PAID);
      if (
        paymentStatus === PosPaymentStatusType.PAID &&
        (dto.amountReceived ?? calculated.grandTotal) < calculated.grandTotal
      )
        throw new BadRequestException(
          'Amount received is less than the bill total',
        );
      if (calculated.couponCode) {
        const result = await this.couponModel
          .updateOne(
            {
              code: calculated.couponCode,
              status: CouponStatus.ACTIVE,
              $or: [
                { usageLimit: null },
                { usageLimit: { $exists: false } },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
              ],
            },
            { $inc: { usedCount: 1 } },
          )
          .exec();
        if (result.modifiedCount !== 1)
          throw new BadRequestException(
            'This coupon usage limit has been reached',
          );
        couponReserved = true;
      }
      const amountReceived =
        paymentStatus === PosPaymentStatusType.PAID
          ? (dto.amountReceived ?? calculated.grandTotal)
          : 0;
      const bill = await this.billModel.create({
        billNumber: `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String((await this.billModel.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })) + 1).padStart(4, '0')}`,
        createdBy: new Types.ObjectId(adminId),
        customerName: dto.customer?.name,
        customerMobile: dto.customer?.mobile,
        customerEmail: dto.customer?.email,
        shippingAddress: dto.shippingAddress
          ? {
              fullName: dto.shippingAddress.fullName,
              streetAddress: dto.shippingAddress.streetAddress,
              city: dto.shippingAddress.city,
              state: dto.shippingAddress.state ?? '',
              pincode: dto.shippingAddress.pincode,
              landmark: dto.shippingAddress.landmark ?? '',
            }
          : undefined,
        items: calculated.items,
        subtotal: calculated.subtotal,
        totalDiscount: calculated.totalDiscount,
        couponCode: calculated.couponCode || undefined,
        couponDiscount: calculated.couponDiscount,
        grandTotal: calculated.grandTotal,
        paymentMethod: dto.paymentMethod,
        paymentStatus,
        amountReceived,
        changeAmount: Math.max(amountReceived - calculated.grandTotal, 0),
        status: PosBillStatusType.COMPLETED,
      });
      return { message: 'POS bill created successfully', data: bill };
    } catch (error) {
      if (couponReserved && calculated.couponCode)
        await this.couponModel
          .updateOne(
            { code: calculated.couponCode, usedCount: { $gt: 0 } },
            { $inc: { usedCount: -1 } },
          )
          .exec();
      for (const item of deducted) {
        await this.productModel
          .updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: item.quantity } },
          )
          .exec();
        await this.refreshStockStatus(item.productId);
      }
      throw error;
    }
  }

  private async refreshStockStatus(productId: Types.ObjectId) {
    const product = await this.productModel.findById(productId).exec();
    if (!product || product.stockQuantity === undefined) return;
    const threshold = product.lowStockThreshold ?? 10;
    product.stockStatus =
      product.stockQuantity === 0
        ? StockStatusType.OUT_OF_STOCK
        : product.stockQuantity <= threshold
          ? StockStatusType.LOW_STOCK
          : StockStatusType.IN_STOCK;
    await product.save();
  }

  async findAll(query: PosListQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search?.trim())
      filter.billNumber = { $regex: query.search.trim(), $options: 'i' };
    const data = await this.billModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return {
      message: 'POS bills fetched successfully',
      count: data.length,
      data,
    };
  }
  async findOne(billNumber: string) {
    const data = await this.billModel.findOne({ billNumber }).exec();
    if (!data) throw new NotFoundException('POS bill not found');
    return { message: 'POS bill fetched successfully', data };
  }
  async receipt(billNumber: string) {
    const result = await this.findOne(billNumber);
    return { message: 'POS receipt fetched successfully', data: result.data };
  }
  async cancel(billNumber: string) {
    const bill = await this.billModel.findOne({ billNumber }).exec();
    if (!bill) throw new NotFoundException('POS bill not found');
    if (bill.status === PosBillStatusType.CANCELLED)
      throw new BadRequestException('POS bill is already cancelled');
    for (const item of bill.items)
      await this.productModel
        .updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } },
        )
        .exec();
    for (const item of bill.items)
      await this.refreshStockStatus(item.productId);
    if (bill.couponCode)
      await this.couponModel
        .updateOne(
          { code: bill.couponCode, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
        )
        .exec();
    bill.status = PosBillStatusType.CANCELLED;
    await bill.save();
    return { message: 'POS bill cancelled successfully', data: bill };
  }
}
