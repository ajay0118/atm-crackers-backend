import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AdminRefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true, index: true })
  adminId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, select: false })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export type AdminRefreshTokenDocument = HydratedDocument<AdminRefreshToken>;
export const AdminRefreshTokenSchema =
  SchemaFactory.createForClass(AdminRefreshToken);
AdminRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
