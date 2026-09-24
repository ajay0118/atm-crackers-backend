import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatusType } from '@libs/contracts/order/order.schema';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatusType, example: PaymentStatusType.PAID })
  @IsEnum(PaymentStatusType)
  status: PaymentStatusType;
}
