import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsMobilePhone, IsOptional, IsPostalCode, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethodType, PaymentMethodType } from '@libs/contracts/order/order.schema';

export class CheckoutAddressDto {
  @ApiProperty({ example: 'Ajay Venkatesh' }) @IsString() @Length(2, 100) fullName: string;
  @ApiProperty({ example: '123 Main Street' }) @IsString() @Length(3, 200) streetAddress: string;
  @ApiProperty({ example: 'Paramakudi' }) @IsString() @Length(2, 100) city: string;
  @ApiPropertyOptional({ example: 'Tamil Nadu' }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ example: '623707' }) @IsPostalCode('IN') pincode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
}

export class CheckoutCustomerDto {
  @ApiProperty({ example: 'Ajay Venkatesh' }) @IsString() @Length(2, 100) name: string;
  @ApiProperty({ example: '8778176646' }) @IsMobilePhone('en-IN') mobile: string;
  @ApiPropertyOptional({ example: 'ajay@gmail.com' }) @IsOptional() @IsEmail() email?: string;
}

export class CheckoutDto {
  @ApiProperty({ example: 'test-cart-001' }) @IsString() @Length(1, 100) cartKey: string;
  @ApiProperty({ type: CheckoutCustomerDto }) @ValidateNested() @Type(() => CheckoutCustomerDto) customer: CheckoutCustomerDto;
  @ApiProperty({ type: CheckoutAddressDto }) @ValidateNested() @Type(() => CheckoutAddressDto) shippingAddress: CheckoutAddressDto;
  @ApiPropertyOptional({ enum: DeliveryMethodType, default: DeliveryMethodType.STANDARD }) @IsOptional() @IsEnum(DeliveryMethodType) deliveryMethod?: DeliveryMethodType;
  @ApiPropertyOptional({ description: 'Internal only. Customer does not choose online payment.', default: PaymentMethodType.MANUAL }) @IsOptional() @IsEnum(PaymentMethodType) paymentMethod?: PaymentMethodType;
  @ApiPropertyOptional() @IsOptional() @IsString() promoCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] }) @IsEnum(['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as any) status: string;
}
