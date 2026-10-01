import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StoreSettings,
  StoreSettingsDocument,
} from '@libs/contracts/store-settings/store-settings.schema';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { UploadedImageFile } from '../common/file/file-helper.service';
import { FileHelperService } from '../common/file/file-helper.service';

const DEFAULT_SETTINGS = {
  key: 'default',
  storeName: 'ATM Crackers Sivakasi',
  tagline: '',
  gstin: '',
  supportPhone: '',
  address: '',
  receiptFooterMessage: '',
  logoUrl: '',
};

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectModel(StoreSettings.name)
    private readonly settingsModel: Model<StoreSettingsDocument>,
    private readonly fileHelper: FileHelperService,
  ) {}

  private async getOrCreate() {
    const existing = await this.settingsModel
      .findOne({ key: DEFAULT_SETTINGS.key })
      .lean()
      .exec();
    if (existing) return existing;
    return this.settingsModel.create(DEFAULT_SETTINGS);
  }

  private async withLogoUrl(settings: any) {
    if (!settings) return settings;
    return {
      ...settings,
      logoUrl: await this.fileHelper.url(settings.logoUrl),
    };
  }

  async get() {
    return {
      message: 'Store settings fetched successfully',
      data: await this.withLogoUrl(await this.getOrCreate()),
    };
  }

  async update(dto: UpdateStoreSettingsDto) {
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('At least one store setting is required');
    }
    const settings = await this.settingsModel
      .findOneAndUpdate(
        { key: DEFAULT_SETTINGS.key },
        {
          $set: updates,
          $setOnInsert: Object.fromEntries(
            Object.entries(DEFAULT_SETTINGS).filter(
              ([field]) => !(field in updates),
            ),
          ),
        },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      )
      .lean()
      .exec();
    return {
      message: 'Store settings updated successfully',
      data: await this.withLogoUrl(settings),
    };
  }

  async uploadLogo(file: UploadedImageFile) {
    const settings = await this.getOrCreate();
    const oldKey = settings.logoUrl;
    const key = await this.fileHelper.upload(file, 'store/logo');
    const updated = await this.settingsModel
      .findOneAndUpdate(
        { key: DEFAULT_SETTINGS.key },
        { $set: { logoUrl: key } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    await this.fileHelper.delete(oldKey);
    return {
      message: 'Store logo uploaded successfully',
      data: { ...updated, logoUrl: await this.fileHelper.url(key) },
    };
  }

  async deleteLogo() {
    const settings = await this.getOrCreate();
    const oldKey = settings.logoUrl;
    await this.settingsModel
      .updateOne({ key: DEFAULT_SETTINGS.key }, { $set: { logoUrl: '' } })
      .exec();
    await this.fileHelper.delete(oldKey);
    return {
      message: 'Store logo deleted successfully',
      data: { logoUrl: '' },
    };
  }
}
