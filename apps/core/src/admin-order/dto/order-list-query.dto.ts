import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  OrderStatusType,
  PaymentStatusType,
} from '@libs/contracts/order/order.schema';

export class OrderListQueryDto {
  @ApiPropertyOptional({ example: 'ATM-20260923' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: OrderStatusType })
  @IsOptional()
  @IsEnum(OrderStatusType)
  orderStatus?: OrderStatusType;

  @ApiPropertyOptional({ enum: PaymentStatusType })
  @IsOptional()
  @IsEnum(PaymentStatusType)
  paymentStatus?: PaymentStatusType;
}
