import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Model } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '@libs/contracts/category/category.schema';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import { calculateSellingPrice, slugify } from './catalogue.utils';
import { CatalogueSeedFile } from './catalogue.seed.types';

@Injectable()
export class CatalogueSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogueSeedService.name);
  private readonly seedFilePath = join(
    process.cwd(),
    'apps/core/src/catalogue/data/catalogue.seed.json',
  );

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.AUTO_SEED_CATALOGUE === 'false'
    ) {
      return;
    }

    const [categoryCount, productCount] = await Promise.all([
      this.categoryModel.countDocuments(),
      this.productModel.countDocuments(),
    ]);

    if (categoryCount > 0 || productCount > 0) {
      return;
    }

    await this.seedSampleCatalogue();
    this.logger.log('Seeded development catalogue data');
  }

  async seedSampleCatalogue(): Promise<void> {
    const seedFile = this.loadSeedFile();
    const categoryImageUrl =
      seedFile.defaults?.categoryImageUrl ??
      'https://placehold.co/720x720/F5A623/111827?text=ATM+Crackers';
    const productImageUrl =
      seedFile.defaults?.productImageUrl ??
      'https://placehold.co/600x600/F5A623/111827?text=ATM+Crackers';

    for (const [categoryIndex, categorySeed] of seedFile.categories.entries()) {
      const category = await this.categoryModel.create({
        name: categorySeed.name,
        slug: slugify(categorySeed.name),
        description: '',
        imageUrl: categoryImageUrl,
        status: CommonStatusType.ACTIVE,
        displayOrder: categorySeed.displayOrder ?? categoryIndex + 1,
      });

      const products = categorySeed.products.map((productSeed, index) => ({
        category: category._id,
        name: productSeed.name,
        slug: slugify(productSeed.name),
        description: '',
        images: [productImageUrl],
        mrp: productSeed.mrp,
        discountPercent: 0,
        sellingPrice: calculateSellingPrice(productSeed.mrp, 0),
        stockStatus: StockStatusType.IN_STOCK,
        status: CommonStatusType.ACTIVE,
        displayOrder: productSeed.displayOrder ?? index + 1,
      }));

      if (products.length > 0) {
        await this.productModel.insertMany(products);
      }
    }
  }

  private loadSeedFile(): CatalogueSeedFile {
    const raw = readFileSync(this.seedFilePath, 'utf8');
    return JSON.parse(raw) as CatalogueSeedFile;
  }
}
