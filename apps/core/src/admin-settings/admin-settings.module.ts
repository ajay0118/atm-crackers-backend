import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StoreSettings,
  StoreSettingsSchema,
} from '@libs/contracts/store-settings/store-settings.schema';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreSettings.name, schema: StoreSettingsSchema },
    ]),
  ],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
})
export class AdminSettingsModule {}
