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

@Injectable()
export class AdminProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
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

  private result(product: ProductDocument) {
    const value = product.toObject() as unknown as Record<string, unknown>;
    const category =
      typeof value.category === 'object' && value.category !== null
        ? value.category
        : value.category;
    return { ...value, category, id: product._id.toString() };
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
      stockStatus: dto.stockStatus ?? StockStatusType.IN_STOCK,
      status: dto.status ?? CommonStatusType.ACTIVE,
      displayOrder: dto.displayOrder ?? 0,
    });
    await product.populate('category');
    return {
      message: 'Product created successfully',
      data: this.result(product),
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
      data: products.map((product) => this.result(product)),
    };
  }

  async findOne(id: string) {
    return {
      message: 'Product fetched successfully',
      data: this.result(await this.findProduct(id)),
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
    Object.assign(product, {
      category: categoryId,
      name: nextName,
      slug: nextSlug,
      mrp,
      discountPercent,
      sellingPrice: this.price(mrp, discountPercent),
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
      data: this.result(product),
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
}
