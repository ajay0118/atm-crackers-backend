import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CommonStatusType } from '../enums/common.enum';

@Schema({ _id: true })
export class CustomerAddress {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  streetAddress: string;

  @Prop({ trim: true, default: '' })
  city: string;

  @Prop({ trim: true, default: '' })
  state: string;

  @Prop({ required: true, trim: true })
  pincode: string;

  @Prop({ trim: true, default: '' })
  landmark: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const CustomerAddressSchema =
  SchemaFactory.createForClass(CustomerAddress);

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  normalizedMobile: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ enum: CommonStatusType, default: CommonStatusType.ACTIVE })
  status: CommonStatusType;

  @Prop({ type: [CustomerAddressSchema], default: [] })
  addresses: CustomerAddress[];
}

export type CustomerDocument = HydratedDocument<Customer>;

export const CustomerSchema = SchemaFactory.createForClass(Customer);
