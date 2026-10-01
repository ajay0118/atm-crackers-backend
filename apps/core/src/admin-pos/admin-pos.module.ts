import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '@libs/contracts/product/product.schema';
import { Coupon, CouponSchema } from '@libs/contracts/coupon/coupon.schema';
import {
  PosBill,
  PosBillSchema,
} from '@libs/contracts/pos-bill/pos-bill.schema';
import { OfferModule } from '../offer/offer.module';
import { AdminPosController } from './admin-pos.controller';
import { AdminPosService } from './admin-pos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PosBill.name, schema: PosBillSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    OfferModule,
  ],
  controllers: [AdminPosController],
  providers: [AdminPosService],
})
export class AdminPosModule {}
