import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum OrderStatusType { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', PROCESSING = 'PROCESSING', PACKED = 'PACKED', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', CANCELLED = 'CANCELLED' }
export enum PaymentStatusType { PENDING = 'PENDING', PAID = 'PAID', FAILED = 'FAILED', REFUNDED = 'REFUNDED' }
export enum DeliveryMethodType { STANDARD = 'STANDARD', EXPRESS = 'EXPRESS' }
export enum PaymentMethodType { MANUAL = 'MANUAL' }

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Product' }) productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' }) categoryId: Types.ObjectId;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) categoryName: string;
  @Prop({ default: '' }) image: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) mrp: number;
  @Prop({ required: true, min: 0 }) sellingPrice: number;
  @Prop({ required: true, min: 0 }) discountPercent: number;
  @Prop({ required: true, min: 0 }) itemTotal: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderAddress {
  @Prop({ required: true }) fullName: string;
  @Prop({ required: true }) streetAddress: string;
  @Prop({ required: true }) city: string;
  @Prop({ default: '' }) state: string;
  @Prop({ required: true }) pincode: string;
  @Prop({ default: '' }) landmark: string;
}
export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);

@Schema({ _id: false })
export class OrderCustomer {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) mobile: string;
  @Prop({ default: null }) email?: string;
}
export const OrderCustomerSchema = SchemaFactory.createForClass(OrderCustomer);

@Schema({ timestamps: true })
export class Order {
  createdAt?: Date;
  updatedAt?: Date;
  @Prop({ required: true, unique: true, index: true }) orderNumber: string;
  @Prop({ type: Types.ObjectId, required: true, ref: 'Customer' }) customerId: Types.ObjectId;
  @Prop({ required: true, index: true }) customerMobile: string;
  @Prop({ type: OrderCustomerSchema, required: true }) customer: OrderCustomer;
  @Prop({ type: OrderAddressSchema, required: true }) shippingAddress: OrderAddress;
  @Prop({ type: [OrderItemSchema], required: true }) items: OrderItem[];
  @Prop({ required: true, min: 0 }) subtotal: number;
  @Prop({ required: true, min: 0 }) totalDiscount: number;
  @Prop({ required: true, min: 0 }) deliveryCharge: number;
  @Prop({ required: true, min: 0 }) grandTotal: number;
  @Prop({ enum: DeliveryMethodType, required: true }) deliveryMethod: DeliveryMethodType;
  @Prop({ enum: PaymentMethodType, default: PaymentMethodType.MANUAL }) paymentMethod: PaymentMethodType;
  @Prop({ enum: PaymentStatusType, default: PaymentStatusType.PENDING }) paymentStatus: PaymentStatusType;
  @Prop({ enum: OrderStatusType, default: OrderStatusType.PENDING, index: true }) orderStatus: OrderStatusType;
  @Prop({ default: null, trim: true }) promoCode?: string;
}
export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
