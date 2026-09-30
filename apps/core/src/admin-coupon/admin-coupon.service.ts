import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from '@libs/contracts/coupon/coupon.schema';
import { CouponDiscountType } from '@libs/contracts/enums/common.enum';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponListQueryDto } from './dto/coupon-list-query.dto';
@Injectable()
export class AdminCouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}
  private normalize(dto: CreateCouponDto | UpdateCouponDto) {
    if (
      dto.discountType === CouponDiscountType.PERCENTAGE &&
      dto.discountValue !== undefined &&
      dto.discountValue > 100
    )
      throw new BadRequestException('Percentage discount cannot exceed 100');
    if (dto.startAt && dto.expiresAt && dto.expiresAt <= dto.startAt)
      throw new BadRequestException('Expiry must be after start date');
    if (
      dto.maximumDiscount !== undefined &&
      dto.maximumDiscount !== null &&
      dto.discountType === CouponDiscountType.FIXED_AMOUNT
    )
      throw new BadRequestException(
        'Maximum discount applies only to percentage coupons',
      );
    return {
      ...dto,
      ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
    };
  }
  async create(dto: CreateCouponDto) {
    const data = this.normalize(dto);
    if (await this.couponModel.exists({ code: data.code }))
      throw new ConflictException('Coupon code already exists');
    const coupon = await this.couponModel.create(data);
    return { message: 'Coupon created successfully', data: coupon };
  }
  async findAll(query: CouponListQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.search?.trim())
      filter.code = { $regex: query.search.trim(), $options: 'i' };
    const data = await this.couponModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return {
      message: 'Coupons fetched successfully',
      count: data.length,
      data,
    };
  }
  async findOne(id: string) {
    const data = await this.couponModel.findById(id).exec();
    if (!data) throw new NotFoundException('Coupon not found');
    return { message: 'Coupon fetched successfully', data };
  }
  async update(id: string, dto: UpdateCouponDto) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('At least one coupon field is required');
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    const data = this.normalize({
      ...coupon.toObject(),
      ...dto,
    } as CreateCouponDto);
    if (
      data.code &&
      data.code !== coupon.code &&
      (await this.couponModel.exists({ code: data.code, _id: { $ne: id } }))
    )
      throw new ConflictException('Coupon code already exists');
    Object.assign(coupon, data);
    await coupon.save();
    return { message: 'Coupon updated successfully', data: coupon };
  }
  async remove(id: string) {
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.usedCount > 0)
      throw new ConflictException(
        'Used coupons cannot be deleted; deactivate it instead',
      );
    await coupon.deleteOne();
    return { message: 'Coupon deleted successfully' };
  }
}
