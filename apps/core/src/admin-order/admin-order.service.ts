import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatusType,
  PaymentStatusType,
} from '@libs/contracts/order/order.schema';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class AdminOrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  private escape(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async findOrder(orderNumber: string) {
    const value = orderNumber.trim();
    if (!value) throw new BadRequestException('Order number is required');
    const order = await this.orderModel.findOne({ orderNumber: value }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private allowedTransitions: Record<OrderStatusType, OrderStatusType[]> = {
    [OrderStatusType.PENDING]: [
      OrderStatusType.CONFIRMED,
      OrderStatusType.CANCELLED,
    ],
    [OrderStatusType.CONFIRMED]: [
      OrderStatusType.PROCESSING,
      OrderStatusType.CANCELLED,
    ],
    [OrderStatusType.PROCESSING]: [
      OrderStatusType.PACKED,
      OrderStatusType.CANCELLED,
    ],
    [OrderStatusType.PACKED]: [OrderStatusType.SHIPPED],
    [OrderStatusType.SHIPPED]: [OrderStatusType.DELIVERED],
    [OrderStatusType.DELIVERED]: [],
    [OrderStatusType.CANCELLED]: [],
  };

  async findAll(query: OrderListQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.orderStatus) filter.orderStatus = query.orderStatus;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search?.trim()) {
      const search = this.escape(query.search.trim());
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }
    const orders = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return {
      message: 'Admin orders fetched successfully',
      count: orders.length,
      data: orders,
    };
  }

  async findOne(orderNumber: string) {
    return {
      message: 'Admin order fetched successfully',
      data: await this.findOrder(orderNumber),
    };
  }

  async updateStatus(orderNumber: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOrder(orderNumber);
    if (order.orderStatus === dto.status) {
      throw new BadRequestException(`Order is already ${dto.status}`);
    }
    if (!this.allowedTransitions[order.orderStatus].includes(dto.status)) {
      throw new BadRequestException(
        `Invalid order status transition from ${order.orderStatus} to ${dto.status}`,
      );
    }
    order.orderStatus = dto.status;
    await order.save();
    return { message: 'Order status updated successfully', data: order };
  }

  async updatePaymentStatus(orderNumber: string, dto: UpdatePaymentStatusDto) {
    const order = await this.findOrder(orderNumber);
    if (order.paymentStatus === dto.status) {
      throw new BadRequestException(`Payment status is already ${dto.status}`);
    }
    if (
      order.paymentStatus === PaymentStatusType.REFUNDED &&
      dto.status !== PaymentStatusType.REFUNDED
    ) {
      throw new BadRequestException('A refunded payment cannot be changed');
    }
    order.paymentStatus = dto.status;
    await order.save();
    return { message: 'Payment status updated successfully', data: order };
  }

  async cancel(orderNumber: string) {
    const order = await this.findOrder(orderNumber);
    if (order.orderStatus === OrderStatusType.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }
    if (
      !this.allowedTransitions[order.orderStatus].includes(
        OrderStatusType.CANCELLED,
      )
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled after ${order.orderStatus}`,
      );
    }
    order.orderStatus = OrderStatusType.CANCELLED;
    await order.save();
    return { message: 'Order cancelled successfully', data: order };
  }
}
