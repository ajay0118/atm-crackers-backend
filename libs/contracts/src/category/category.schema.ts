import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CommonStatusType } from '@libs/contracts/enums/common.enum';

@Schema({ timestamps: true })
export class Category {
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

  @Prop({ default: '', trim: true })
  imageUrl: string;

  @Prop({
    type: String,
    enum: CommonStatusType,
    default: CommonStatusType.ACTIVE,
    index: true,
  })
  status: CommonStatusType;

  @Prop({ default: 0, index: true })
  displayOrder: number;
}

export type CategoryDocument = HydratedDocument<Category>;

export const CategorySchema = SchemaFactory.createForClass(Category);
