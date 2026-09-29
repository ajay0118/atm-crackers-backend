import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  CouponDiscountType,
  CouponStatus,
} from '@libs/contracts/enums/common.enum';

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  code: string;
  @Prop({ default: '', trim: true }) description: string;
  @Prop({ required: true, enum: CouponDiscountType })
  discountType: CouponDiscountType;
  @Prop({ required: true, min: 0 }) discountValue: number;
  @Prop({ default: 0, min: 0 }) minimumOrderValue: number;
  @Prop({ default: null, min: 0 }) maximumDiscount?: number;
  @Prop({ default: null, min: 1 }) usageLimit?: number;
  @Prop({ default: 0, min: 0 }) usedCount: number;
  @Prop({ default: 1, min: 1 }) perCustomerLimit: number;
  @Prop({ required: true }) startAt: Date;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ enum: CouponStatus, default: CouponStatus.ACTIVE, index: true })
  status: CouponStatus;
}

export type CouponDocument = HydratedDocument<Coupon>;
export const CouponSchema = SchemaFactory.createForClass(Coupon);
