import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '@libs/contracts/category/category.schema';
import { StockStatusType } from '@libs/contracts/enums/common.enum';

@Schema({ timestamps: true })
export class Product {
  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
    index: true,
  })
  category: Types.ObjectId | Category;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true, min: 0 })
  mrp: number;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ required: true, min: 0 })
  sellingPrice: number;

  @Prop({
    default: StockStatusType.IN_STOCK,
    enum: StockStatusType,
    index: true,
  })
  stockStatus: StockStatusType;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0, index: true })
  displayOrder: number;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);
