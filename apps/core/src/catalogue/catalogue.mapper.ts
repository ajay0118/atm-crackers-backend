type MongoIdLike = { toString(): string } | string;

export interface CategoryObject {
  _id?: MongoIdLike;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CategoryResponse {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductCategoryObject {
  _id?: MongoIdLike;
  name?: string;
  slug?: string;
}

export interface ProductObject {
  _id?: MongoIdLike;
  category?: MongoIdLike | ProductCategoryObject;
  name?: string;
  slug?: string;
  description?: string;
  images?: string[];
  mrp?: number;
  discountPercent?: number;
  sellingPrice?: number;
  stockStatus?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductResponse {
  id: string;
  categoryId: string;
  category?: {
    id: string;
    name?: string;
    slug?: string;
  };
  name?: string;
  slug?: string;
  description?: string;
  images?: string[];
  mrp?: number;
  discountPercent?: number;
  sellingPrice?: number;
  stockStatus?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function toId(value: MongoIdLike | undefined): string {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value.toString();
}

export function mapCategory(category: CategoryObject): CategoryResponse {
  return {
    id: toId(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function mapProduct(product: ProductObject): ProductResponse {
  const category =
    product.category &&
    typeof product.category === 'object' &&
    'name' in product.category
      ? product.category
      : undefined;

  const categoryId = category ? toId(category._id) : toId(product.category);

  return {
    id: toId(product._id),
    categoryId,
    category: category
      ? {
          id: toId(category._id),
          name: category.name,
          slug: category.slug,
        }
      : undefined,
    name: product.name,
    slug: product.slug,
    description: product.description,
    images: product.images,
    mrp: product.mrp,
    discountPercent: product.discountPercent,
    sellingPrice: product.sellingPrice,
    stockStatus: product.stockStatus,
    isActive: product.isActive,
    displayOrder: product.displayOrder,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
