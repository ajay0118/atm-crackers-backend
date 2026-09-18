import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '@libs/contracts/cart/cart.schema';
import { Category } from '@libs/contracts/category/category.schema';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';
import {
  Product,
  ProductDocument,
} from '@libs/contracts/product/product.schema';
import {
  Customer,
  CustomerDocument,
} from '@libs/contracts/customer/customer.schema';
import { calculateSellingPrice } from '../catalogue/catalogue.utils';
import {
  DeliveryMethodType,
  Order,
  OrderDocument,
  OrderStatusType,
  PaymentMethodType,
  PaymentStatusType,
} from '@libs/contracts/order/order.schema';
import { CheckoutDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  private normalizeMobile(mobile: string) {
    const value = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(value))
      throw new BadRequestException('Valid Indian mobile number is required');
    return value;
  }
  private normalizeCartKey(cartKey: string) {
    const value = cartKey?.trim();
    if (!value || value.length > 100)
      throw new BadRequestException('Valid X-Cart-Key header is required');
    return value;
  }
  private deliveryCharge(_method?: DeliveryMethodType) {
    return 0;
  }
  private async customer(dto: CheckoutDto) {
    const normalizedMobile = this.normalizeMobile(dto.customer.mobile);
    let customer = await this.customerModel
      .findOne({ normalizedMobile })
      .exec();
    if (!customer)
      customer = new this.customerModel({
        name: dto.customer.name.trim(),
        mobile: dto.customer.mobile.trim(),
        normalizedMobile,
        email: dto.customer.email?.trim().toLowerCase(),
        addresses: [],
      });
    else {
      customer.name = dto.customer.name.trim();
      customer.mobile = dto.customer.mobile.trim();
      if (dto.customer.email !== undefined)
        customer.email = dto.customer.email.trim().toLowerCase();
    }
    await customer.save();
    return customer;
  }
  private async calculate(dto: CheckoutDto) {
    const cart = await this.cartModel
      .findOne({ cartKey: dto.cartKey.trim() })
      .exec();
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Cart is empty');
    const items: any[] = [];
    for (const cartItem of cart.items) {
      const product = await this.productModel
        .findOne({ _id: cartItem.productId, status: CommonStatusType.ACTIVE })
        .populate('category')
        .exec();
      if (!product || product.stockStatus === StockStatusType.OUT_OF_STOCK)
        throw new BadRequestException(
          `Product ${cartItem.productId} is no longer available`,
        );
      const category = product.category as Category & { _id: Types.ObjectId };
      if (!category || category.status !== CommonStatusType.ACTIVE)
        throw new BadRequestException(
          `Product ${product.name} category is inactive`,
        );
      const sellingPrice = calculateSellingPrice(
        product.mrp,
        product.discountPercent,
      );
      items.push({
        productId: product._id,
        categoryId: category._id,
        productName: product.name,
        categoryName: category.name,
        image: product.images[0] ?? '',
        quantity: cartItem.quantity,
        mrp: product.mrp,
        sellingPrice,
        discountPercent: product.discountPercent,
        itemTotal: sellingPrice * cartItem.quantity,
      });
    }
    const subtotal = items.reduce(
      (sum, item) => sum + item.mrp * item.quantity,
      0,
    );
    const itemTotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const deliveryCharge = this.deliveryCharge(dto.deliveryMethod);
    return {
      cart,
      items,
      subtotal,
      totalDiscount: subtotal - itemTotal,
      deliveryCharge,
      grandTotal: itemTotal + deliveryCharge,
    };
  }
  private result(order: OrderDocument) {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      totalDiscount: order.totalDiscount,
      deliveryCharge: order.deliveryCharge,
      grandTotal: order.grandTotal,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      promoCode: order.promoCode ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
  private async orderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.orderModel.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    return `ATM-${date}-${String(count + 1).padStart(4, '0')}`;
  }
  async preview(dto: CheckoutDto) {
    const calculated = await this.calculate(dto);
    return {
      message: 'Checkout preview calculated successfully',
      data: {
        items: calculated.items,
        subtotal: calculated.subtotal,
        totalDiscount: calculated.totalDiscount,
        deliveryCharge: calculated.deliveryCharge,
        grandTotal: calculated.grandTotal,
        deliveryMethod: dto.deliveryMethod ?? DeliveryMethodType.STANDARD,
        paymentStatus: PaymentStatusType.PENDING,
      },
    };
  }
  async create(dto: CheckoutDto) {
    const calculated = await this.calculate(dto);
    const cartKey = this.normalizeCartKey(dto.cartKey);
    const customer = await this.customer(dto);
    const order = new this.orderModel({
      orderNumber: await this.orderNumber(),
      cartKey,
      customerId: customer._id,
      customerMobile: customer.normalizedMobile,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email ?? null,
      },
      shippingAddress: dto.shippingAddress,
      items: calculated.items,
      subtotal: calculated.subtotal,
      totalDiscount: calculated.totalDiscount,
      deliveryCharge: calculated.deliveryCharge,
      grandTotal: calculated.grandTotal,
      deliveryMethod: dto.deliveryMethod ?? DeliveryMethodType.STANDARD,
      paymentMethod: PaymentMethodType.MANUAL,
      paymentStatus: PaymentStatusType.PENDING,
      orderStatus: OrderStatusType.PENDING,
      promoCode: dto.promoCode ?? null,
    });
    await order.save();
    calculated.cart.items = [];
    await calculated.cart.save();
    return {
      message:
        'Order placed successfully. Owner will contact the customer for payment.',
      data: this.result(order),
    };
  }
  async bySession(cartKey: string) {
    const key = this.normalizeCartKey(cartKey);
    const orders = await this.orderModel
      .find({ cartKey: key })
      .sort({ createdAt: -1 })
      .exec();
    return {
      message: 'Session orders fetched successfully',
      count: orders.length,
      data: orders.map((order) => this.result(order)),
    };
  }
  async get(orderNumber: string, cartKey: string) {
    const key = this.normalizeCartKey(cartKey);
    const order = await this.orderModel
      .findOne({ orderNumber, cartKey: key })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return { message: 'Order fetched successfully', data: this.result(order) };
  }
  async byMobile(mobile: string) {
    const orders = await this.orderModel
      .find({ customerMobile: this.normalizeMobile(mobile) })
      .sort({ createdAt: -1 })
      .exec();
    return {
      message: 'Customer orders fetched successfully',
      count: orders.length,
      data: orders.map((order) => this.result(order)),
    };
  }
  async cancel(orderNumber: string, cartKey: string) {
    const key = this.normalizeCartKey(cartKey);
    const order = await this.orderModel
      .findOne({ orderNumber, cartKey: key })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    if (
      [
        OrderStatusType.SHIPPED,
        OrderStatusType.DELIVERED,
        OrderStatusType.CANCELLED,
      ].includes(order.orderStatus)
    )
      throw new BadRequestException('This order cannot be cancelled');
    order.orderStatus = OrderStatusType.CANCELLED;
    await order.save();
    return {
      message: 'Order cancelled successfully',
      data: this.result(order),
    };
  }
  async track(orderNumber: string, cartKey: string) {
    const key = this.normalizeCartKey(cartKey);
    const order = await this.orderModel
      .findOne(
        { orderNumber, cartKey: key },
        'orderNumber orderStatus paymentStatus deliveryMethod createdAt updatedAt',
      )
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return { message: 'Order tracking fetched successfully', data: order };
  }
}
