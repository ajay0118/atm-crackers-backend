import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogueModule } from './catalogue/catalogue.module';
import { CartModule } from './cart/cart.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { AdminModule } from './admin/admin.module';
import { AdminCategoryModule } from './admin-category/admin-category.module';
import { AdminProductModule } from './admin-product/admin-product.module';
import { AdminOrderModule } from './admin-order/admin-order.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { AdminCouponModule } from './admin-coupon/admin-coupon.module';
import { AdminOfferModule } from './admin-offer/admin-offer.module';
import { OfferModule } from './offer/offer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 10000,

        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });

          connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
          });

          return connection;
        },
      }),
    }),
    CatalogueModule,
    CartModule,
    CustomerModule,
    OrderModule,
    AdminModule,
    AdminCategoryModule,
    AdminProductModule,
    AdminOrderModule,
    AdminSettingsModule,
    AdminCouponModule,
    AdminOfferModule,
    OfferModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
