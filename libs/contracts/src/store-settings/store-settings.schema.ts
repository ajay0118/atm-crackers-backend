import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class StoreSettings {
  @Prop({ required: true, unique: true, default: 'default' })
  key: string;

  @Prop({ required: true, trim: true })
  storeName: string;

  @Prop({ default: '', trim: true })
  tagline: string;

  @Prop({ default: '', uppercase: true, trim: true })
  gstin: string;

  @Prop({ default: '', trim: true })
  supportPhone: string;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '', trim: true })
  receiptFooterMessage: string;
}

export type StoreSettingsDocument = HydratedDocument<StoreSettings>;
export const StoreSettingsSchema = SchemaFactory.createForClass(StoreSettings);
