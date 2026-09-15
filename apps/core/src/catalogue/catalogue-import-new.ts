import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import mongoose, { Types } from 'mongoose';
import { CategorySchema } from '@libs/contracts/category/category.schema';
import { ProductSchema } from '@libs/contracts/product/product.schema';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import { calculateSellingPrice } from './catalogue.utils';
import { CatalogueSeedFile } from './catalogue.seed.types';

type NewCatalogue = CatalogueSeedFile & {
  catalogueVersion?: string;
  sourceFile?: string;
  uncertainItems?: unknown[];
  summary?: { categoryCount?: number; productCount?: number };
};

type NewProduct = {
  name: string;
  slug: string;
  unit: string;
  mrp: number;
  discountPercent?: number;
  displayOrder?: number;
};
type NewCategory = {
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  products: NewProduct[];
};

const filePath = join(
  process.cwd(),
  'apps/core/src/catalogue/data/catalogue.seed-new.json',
);
const catalogue = JSON.parse(readFileSync(filePath, 'utf8')) as NewCatalogue;
const categories = (catalogue.categories ?? []) as NewCategory[];
const products = categories.flatMap((category) => category.products ?? []);

const expectedCategories = categories.length;
const skippedProducts = products.filter(
  (product) => !product.name || !product.unit || product.mrp == null,
);
const importableProducts = products.filter(
  (product) => product.name && product.unit && product.mrp != null,
);
const categoryImageUrl =
  catalogue.defaults?.categoryImageUrl ??
  'https://placehold.co/720x720/F5A623/111827?text=ATM+Crackers';
const productImageUrl =
  catalogue.defaults?.productImageUrl ??
  'https://placehold.co/600x600/F5A623/111827?text=ATM+Crackers';

if (skippedProducts.some((product) => !product.name || !product.unit)) {
  throw new Error(
    'Import stopped: a product is missing its name or unit. Only missing-MRP products can be skipped.',
  );
}

if (
  catalogue.summary?.categoryCount !== undefined &&
  catalogue.summary.categoryCount !== expectedCategories
) {
  throw new Error(
    `Import stopped: summary categoryCount=${catalogue.summary.categoryCount}, actual=${expectedCategories}.`,
  );
}

if (
  catalogue.summary?.productCount !== undefined &&
  catalogue.summary.productCount !== products.length
) {
  throw new Error(
    `Import stopped: summary productCount=${catalogue.summary.productCount}, actual=${products.length}.`,
  );
}

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);
  const CategoryModel = mongoose.model('Category', CategorySchema);
  const ProductModel = mongoose.model('Product', ProductSchema);
  try {
    await ProductModel.collection.dropIndex('slug_1');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('index not found')) throw error;
  }
  await ProductModel.collection.createIndex(
    { category: 1, slug: 1 },
    { unique: true },
  );
  const activeCategorySlugs = new Set(
    categories.map((category) => category.slug),
  );
  const activeProductKeys = new Set<string>();
  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  let productsCreated = 0;
  let productsUpdated = 0;

  try {
    for (const [categoryIndex, categorySeed] of categories.entries()) {
      const existingCategory = await CategoryModel.exists({
        slug: categorySeed.slug,
      });
      const category = await CategoryModel.findOneAndUpdate(
        { slug: categorySeed.slug },
        {
          $set: {
            name: categorySeed.name,
            description: categorySeed.description ?? '',
            imageUrl: categoryImageUrl,
            status: CommonStatusType.ACTIVE,
            displayOrder: categorySeed.displayOrder ?? categoryIndex + 1,
          },
          $setOnInsert: { slug: categorySeed.slug },
        },
        { upsert: true, returnDocument: 'after', rawResult: false },
      );
      if (!category)
        throw new Error(`Category upsert failed: ${categorySeed.slug}`);
      if (existingCategory) categoriesUpdated += 1;
      else categoriesCreated += 1;

      for (const [
        productIndex,
        productSeed,
      ] of categorySeed.products.entries()) {
        if (productSeed.mrp == null) continue;
        const key = `${categorySeed.slug}::${productSeed.slug}`;
        activeProductKeys.add(key);
        const existingProduct = await ProductModel.exists({
          category: category._id,
          slug: productSeed.slug,
        });
        await ProductModel.findOneAndUpdate(
          { category: category._id, slug: productSeed.slug },
          {
            $set: {
              name: productSeed.name,
              description: '',
              images: [productImageUrl],
              mrp: productSeed.mrp,
              discountPercent: productSeed.discountPercent ?? 0,
              sellingPrice: calculateSellingPrice(
                productSeed.mrp,
                productSeed.discountPercent ?? 0,
              ),
              stockStatus: StockStatusType.IN_STOCK,
              status: CommonStatusType.ACTIVE,
              displayOrder: productSeed.displayOrder ?? productIndex + 1,
            },
            $setOnInsert: {
              category: new Types.ObjectId(category._id),
              slug: productSeed.slug,
            },
          },
          { upsert: true, returnDocument: 'after' },
        );
        if (existingProduct) productsUpdated += 1;
        else productsCreated += 1;
      }
    }

    await CategoryModel.updateMany(
      { slug: { $nin: [...activeCategorySlugs] } },
      { $set: { status: CommonStatusType.INACTIVE } },
    );
    const activeCategories = await CategoryModel.find({
      slug: { $in: [...activeCategorySlugs] },
    })
      .select('_id slug')
      .lean();
    await ProductModel.bulkWrite(
      activeCategories.map((category) => {
        const categorySeed = categories.find(
          (entry) => entry.slug === category.slug,
        );
        const currentSlugs = (categorySeed?.products ?? []).map(
          (product) => product.slug,
        );
        return {
          updateMany: {
            filter: { category: category._id, slug: { $nin: currentSlugs } },
            update: { $set: { status: CommonStatusType.INACTIVE } },
          },
        };
      }),
    );
    console.log(
      JSON.stringify(
        {
          message: 'New catalogue imported successfully',
          categories: {
            source: expectedCategories,
            created: categoriesCreated,
            updated: categoriesUpdated,
          },
          products: {
            source: products.length,
            imported: importableProducts.length,
            created: productsCreated,
            updated: productsUpdated,
            skipped: skippedProducts.map((product) => product.name),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
