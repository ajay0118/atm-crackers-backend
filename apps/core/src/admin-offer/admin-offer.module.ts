import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema } from '@libs/contracts/offer/offer.schema';
import { AdminOfferController } from './admin-offer.controller';
import { AdminOfferService } from './admin-offer.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  controllers: [AdminOfferController],
  providers: [AdminOfferService],
})
export class AdminOfferModule {}
