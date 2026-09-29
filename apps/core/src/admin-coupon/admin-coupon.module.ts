import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from '@libs/contracts/coupon/coupon.schema';
import { AdminCouponController } from './admin-coupon.controller';
import { AdminCouponService } from './admin-coupon.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [AdminCouponController],
  providers: [AdminCouponService],
})
export class AdminCouponModule {}
