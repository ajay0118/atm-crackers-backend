import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema } from '@libs/contracts/offer/offer.schema';
import { OfferPricingService } from './offer-pricing.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  providers: [OfferPricingService],
  exports: [OfferPricingService],
})
export class OfferModule {}
