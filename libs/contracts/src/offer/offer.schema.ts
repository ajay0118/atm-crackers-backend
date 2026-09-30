import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CommonStatusType,
  OfferScopeType,
} from '@libs/contracts/enums/common.enum';

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ default: '', trim: true }) description: string;
  @Prop({ required: true, min: 0, max: 100 }) discountPercent: number;
  @Prop({ required: true, enum: OfferScopeType, index: true })
  scope: OfferScopeType;
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categoryIds: Types.ObjectId[];
  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];
  @Prop({ required: true }) startAt: Date;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({
    enum: CommonStatusType,
    default: CommonStatusType.ACTIVE,
    index: true,
  })
  status: CommonStatusType;
}

export type OfferDocument = HydratedDocument<Offer>;
export const OfferSchema = SchemaFactory.createForClass(Offer);
