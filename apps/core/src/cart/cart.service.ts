import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '@libs/contracts/cart/cart.schema';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import { Category } from '@libs/contracts/category/category.schema';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import { calculateSellingPrice } from '../catalogue/catalogue.utils';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private validateCartKey(cartKey: string): string {
    const value = cartKey?.trim();
    if (!value || value.length > 100)
      throw new BadRequestException('Valid X-Cart-Key header is required');
    return value;
  }

  private async getProduct(productId: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException('Invalid product ID');
    const product = await this.productModel
      .findOne({ _id: productId, status: CommonStatusType.ACTIVE })
      .populate('category')
      .exec();
    if (!product) throw new NotFoundException('Active product not found');
    const category = product.category as
      (Category & { _id: Types.ObjectId }) | undefined;
    if (!category || category.status !== CommonStatusType.ACTIVE)
      throw new NotFoundException('Product category is not active');
    if (product.stockStatus === StockStatusType.OUT_OF_STOCK)
      throw new BadRequestException('Product is out of stock');
    return product;
  }

  private async getOrCreateCart(cartKey: string): Promise<CartDocument> {
    return this.cartModel
      .findOneAndUpdate(
        { cartKey },
        { $setOnInsert: { cartKey, items: [] } },
        { new: true, upsert: true },
      )
      .exec();
  }

  private async formatCart(cart: CartDocument) {
    const items: Array<{
      productId: string;
      categoryId: string;
      category: { id: string; name: string; slug: string };
      name: string;
      images: string[];
      quantity: number;
      mrp: number;
      discountPercent: number;
      sellingPrice: number;
      itemTotal: number;
      stockStatus: StockStatusType;
    }> = [];
    for (const item of cart.items) {
      try {
        const product = await this.getProduct(item.productId.toString());
        const category = product.category as Category & { _id: Types.ObjectId };
        const sellingPrice = calculateSellingPrice(
          product.mrp,
          product.discountPercent,
        );
        items.push({
          productId: product._id.toString(),
          categoryId: category._id.toString(),
          category: {
            id: category._id.toString(),
            name: category.name,
            slug: category.slug,
          },
          name: product.name,
          images: product.images,
          quantity: item.quantity,
          mrp: product.mrp,
          discountPercent: product.discountPercent,
          sellingPrice,
          itemTotal: sellingPrice * item.quantity,
          stockStatus: product.stockStatus,
        });
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }
    }
    const subtotal = items.reduce(
      (sum, item) => sum + item.mrp * item.quantity,
      0,
    );
    const grandTotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    return {
      cartKey: cart.cartKey,
      items,
      summary: {
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        totalDiscount: subtotal - grandTotal,
        grandTotal,
      },
    };
  }

  async addItem(cartKey: string, dto: AddCartItemDto) {
    const key = this.validateCartKey(cartKey);
    await this.getProduct(dto.productId);
    const cart = await this.getOrCreateCart(key);
    const item = cart.items.find(
      (entry) => entry.productId.toString() === dto.productId,
    );
    if (item) item.quantity += dto.quantity;
    else
      cart.items.push({
        productId: new Types.ObjectId(dto.productId),
        quantity: dto.quantity,
      });
    await cart.save();
    return {
      message: 'Product added to cart successfully',
      data: await this.formatCart(cart),
    };
  }

  async getCart(cartKey: string) {
    const key = this.validateCartKey(cartKey);
    const cart = await this.getOrCreateCart(key);
    return {
      message: 'Cart fetched successfully',
      data: await this.formatCart(cart),
    };
  }

  async updateItem(cartKey: string, productId: string, dto: UpdateCartItemDto) {
    const key = this.validateCartKey(cartKey);
    await this.getProduct(productId);
    const cart = await this.getOrCreateCart(key);
    const item = cart.items.find(
      (entry) => entry.productId.toString() === productId,
    );
    if (!item) throw new NotFoundException('Product is not in the cart');
    item.quantity = dto.quantity;
    await cart.save();
    return {
      message: 'Cart item updated successfully',
      data: await this.formatCart(cart),
    };
  }

  async removeItem(cartKey: string, productId: string) {
    const key = this.validateCartKey(cartKey);
    const cart = await this.getOrCreateCart(key);
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    if (cart.items.length === originalLength)
      throw new NotFoundException('Product is not in the cart');
    await cart.save();
    return {
      message: 'Product removed from cart successfully',
      data: await this.formatCart(cart),
    };
  }

  async clearCart(cartKey: string) {
    const key = this.validateCartKey(cartKey);
    const cart = await this.getOrCreateCart(key);
    cart.items = [];
    await cart.save();
    return {
      message: 'Cart cleared successfully',
      data: await this.formatCart(cart),
    };
  }
}
