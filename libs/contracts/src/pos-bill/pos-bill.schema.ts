import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  PosBillStatusType,
  PosPaymentMethodType,
  PosPaymentStatusType,
} from '@libs/contracts/enums/common.enum';

@Schema({ _id: false })
export class PosBillItem {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Product' })
  productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  categoryId: Types.ObjectId;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) categoryName: string;
  @Prop({ default: '' }) image: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) mrp: number;
  @Prop({ required: true, min: 0 }) sellingPrice: number;
  @Prop({ required: true, min: 0, max: 100 }) discountPercent: number;
  @Prop({ type: Types.ObjectId, ref: 'Offer', default: null })
  offerId?: Types.ObjectId;
  @Prop({ default: null }) offerName?: string;
  @Prop({ required: true, min: 0 }) itemTotal: number;
}
export const PosBillItemSchema = SchemaFactory.createForClass(PosBillItem);

@Schema({ timestamps: true })
export class PosBill {
  @Prop({ required: true, unique: true, index: true }) billNumber: string;
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy: Types.ObjectId;
  @Prop({ default: null, trim: true }) customerName?: string;
  @Prop({ default: null, trim: true }) customerMobile?: string;
  @Prop({ default: null, trim: true, lowercase: true }) customerEmail?: string;
  @Prop({
    type: {
      fullName: String,
      streetAddress: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    default: null,
  })
  shippingAddress?: {
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  };
  @Prop({ type: [PosBillItemSchema], required: true }) items: PosBillItem[];
  @Prop({ required: true, min: 0 }) subtotal: number;
  @Prop({ required: true, min: 0 }) totalDiscount: number;
  @Prop({ default: null, uppercase: true, trim: true }) couponCode?: string;
  @Prop({ default: 0, min: 0 }) couponDiscount: number;
  @Prop({ required: true, min: 0 }) grandTotal: number;
  @Prop({ enum: PosPaymentMethodType, required: true })
  paymentMethod: PosPaymentMethodType;
  @Prop({ enum: PosPaymentStatusType, required: true })
  paymentStatus: PosPaymentStatusType;
  @Prop({ min: 0, default: 0 }) amountReceived: number;
  @Prop({ min: 0, default: 0 }) changeAmount: number;
  @Prop({
    enum: PosBillStatusType,
    default: PosBillStatusType.COMPLETED,
    index: true,
  })
  status: PosBillStatusType;
}
export type PosBillDocument = HydratedDocument<PosBill>;
export const PosBillSchema = SchemaFactory.createForClass(PosBill);
