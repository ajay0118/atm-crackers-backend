import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ required: true, unique: true, index: true, trim: true })
  cartKey: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];
}

export type CartDocument = HydratedDocument<Cart>;

export const CartSchema = SchemaFactory.createForClass(Cart);
