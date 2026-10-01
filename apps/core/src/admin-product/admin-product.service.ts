import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '@libs/contracts/category/category.schema';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import { Order, OrderDocument } from '@libs/contracts/order/order.schema';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadedImageFile } from '../common/file/file-helper.service';
import { FileHelperService } from '../common/file/file-helper.service';

@Injectable()
export class AdminProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly fileHelper: FileHelperService,
  ) {}

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private price(mrp: number, discountPercent: number) {
    return Math.round((mrp - (mrp * discountPercent) / 100) * 100) / 100;
  }

  private calculateStockStatus(
    quantity?: number,
    threshold = 10,
    fallback?: StockStatusType,
  ) {
    if (quantity === undefined) return fallback ?? StockStatusType.IN_STOCK;
    if (quantity === 0) return StockStatusType.OUT_OF_STOCK;
    return quantity <= threshold
      ? StockStatusType.LOW_STOCK
      : StockStatusType.IN_STOCK;
  }

  private async findCategory(categoryId: string, requireActive = true) {
    if (!Types.ObjectId.isValid(categoryId))
      throw new BadRequestException('Invalid category id');
    const category = await this.categoryModel
      .findOne({
        _id: categoryId,
        ...(requireActive && { status: CommonStatusType.ACTIVE }),
      })
      .exec();
    if (!category)
      throw new BadRequestException(
        requireActive ? 'Active category not found' : 'Category not found',
      );
    return category;
  }

  private async findProduct(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product id');
    const product = await this.productModel
      .findById(id)
      .populate('category')
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async ensureUnique(
    categoryId: string,
    slug: string,
    excludeId?: string,
  ) {
    const query: Record<string, unknown> = { category: categoryId, slug };
    if (excludeId) query._id = { $ne: excludeId };
    if (await this.productModel.exists(query))
      throw new ConflictException(
        'A product with this slug already exists in this category',
      );
  }

  private async result(product: ProductDocument) {
    const value = product.toObject() as unknown as Record<string, unknown>;
    const populatedCategory =
      typeof value.category === 'object' && value.category !== null
        ? (value.category as Record<string, unknown>)
        : undefined;
    const category = populatedCategory
      ? {
          id: String(populatedCategory._id),
          name: populatedCategory.name,
          slug: populatedCategory.slug,
          displayOrder: populatedCategory.displayOrder,
        }
      : value.category;
    if (typeof value.stockQuantity === 'number') {
      value.stockStatus = this.calculateStockStatus(
        value.stockQuantity,
        typeof value.lowStockThreshold === 'number'
          ? value.lowStockThreshold
          : 10,
        value.stockStatus as StockStatusType,
      );
    }
    return {
      ...value,
      images: await this.fileHelper.urls(product.images),
      category,
      id: product._id.toString(),
    };
  }

  async create(dto: CreateProductDto) {
    await this.findCategory(dto.categoryId);
    const slug = this.slugify(dto.slug || dto.name);
    if (!slug)
      throw new BadRequestException('A valid product slug is required');
    await this.ensureUnique(dto.categoryId, slug);
    const product = await this.productModel.create({
      category: dto.categoryId,
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || '',
      images: dto.images || [],
      mrp: dto.mrp,
      discountPercent: dto.discountPercent,
      sellingPrice: this.price(dto.mrp, dto.discountPercent),
      stockQuantity: dto.stockQuantity,
      lowStockThreshold: dto.lowStockThreshold ?? 10,
      stockStatus: this.calculateStockStatus(
        dto.stockQuantity,
        dto.lowStockThreshold ?? 10,
        dto.stockStatus ?? StockStatusType.IN_STOCK,
      ),
      status: dto.status ?? CommonStatusType.ACTIVE,
      displayOrder: dto.displayOrder ?? 0,
    });
    await product.populate('category');
    return {
      message: 'Product created successfully',
      data: await this.result(product),
    };
  }

  async findAll(query: ProductListQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.stockStatus) filter.stockStatus = query.stockStatus;
    if (query.categoryId) {
      if (!Types.ObjectId.isValid(query.categoryId))
        throw new BadRequestException('Invalid category id');
      filter.category = query.categoryId;
    }
    if (query.search?.trim()) {
      const escaped = query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { slug: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }
    const products = await this.productModel
      .find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .populate('category')
      .exec();
    return {
      message: 'Admin products fetched successfully',
      count: products.length,
      data: await Promise.all(products.map((product) => this.result(product))),
    };
  }

  async findOne(id: string) {
    return {
      message: 'Product fetched successfully',
      data: await this.result(await this.findProduct(id)),
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    if (Object.keys(dto).length === 0)
      throw new BadRequestException('At least one product field is required');
    const product = await this.findProduct(id);
    const categoryId =
      dto.categoryId || (product.category as CategoryDocument)._id.toString();
    await this.findCategory(categoryId);
    const nextName = dto.name?.trim() || product.name;
    const nextSlug = this.slugify(dto.slug || product.slug);
    await this.ensureUnique(categoryId, nextSlug, id);
    const mrp = dto.mrp ?? product.mrp;
    const discountPercent = dto.discountPercent ?? product.discountPercent;
    const stockQuantity = dto.stockQuantity ?? product.stockQuantity;
    const lowStockThreshold =
      dto.lowStockThreshold ?? product.lowStockThreshold ?? 10;
    Object.assign(product, {
      category: categoryId,
      name: nextName,
      slug: nextSlug,
      mrp,
      discountPercent,
      sellingPrice: this.price(mrp, discountPercent),
      stockQuantity,
      lowStockThreshold,
      stockStatus: this.calculateStockStatus(
        stockQuantity,
        lowStockThreshold,
        dto.stockStatus ?? product.stockStatus,
      ),
      ...(dto.description !== undefined && {
        description: dto.description.trim(),
      }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.stockStatus !== undefined && { stockStatus: dto.stockStatus }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
    });
    await product.save();
    await product.populate('category');
    return {
      message: 'Product updated successfully',
      data: await this.result(product),
    };
  }

  async remove(id: string) {
    const product = await this.findProduct(id);
    const orderCount = await this.orderModel
      .countDocuments({ 'items.productId': product._id })
      .exec();
    if (orderCount > 0)
      throw new ConflictException(
        `Product cannot be deleted because it is used in ${orderCount} order(s). Set status to INACTIVE instead.`,
      );
    await product.deleteOne();
    return { message: 'Product deleted successfully' };
  }

  async uploadImages(id: string, files: UploadedImageFile[]) {
    const product = await this.findProduct(id);
    const existing = product.images || [];
    if (existing.length + files.length > 3)
      throw new BadRequestException('A product can have a maximum of 3 images');
    const keys = await this.fileHelper.uploadMany(files, 'products');
    product.images = [...existing, ...keys];
    await product.save();
    return {
      message: 'Product images uploaded successfully',
      data: { images: await this.fileHelper.urls(product.images) },
    };
  }

  async deleteImage(id: string, imageKey: string) {
    const product = await this.findProduct(id);
    if (!product.images?.includes(imageKey))
      throw new NotFoundException('Product image not found');
    product.images = product.images.filter((image) => image !== imageKey);
    await product.save();
    await this.fileHelper.delete(imageKey);
    return {
      message: 'Product image deleted successfully',
      data: { images: await this.fileHelper.urls(product.images) },
    };
  }
}
