import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatusType } from '@libs/contracts/order/order.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatusType, example: OrderStatusType.CONFIRMED })
  @IsEnum(OrderStatusType)
  status: OrderStatusType;
}
