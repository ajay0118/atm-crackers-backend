import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsMobilePhone,
  IsOptional,
  IsPostalCode,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PosPaymentMethodType,
  PosPaymentStatusType,
} from '@libs/contracts/enums/common.enum';

export class PosItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
}
export class PosCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
  @ApiPropertyOptional() @IsOptional() @IsMobilePhone('en-IN') mobile?: string;
  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
export class PosAddressDto {
  @ApiProperty() @IsString() @Length(2, 100) fullName: string;
  @ApiProperty() @IsString() @Length(3, 200) streetAddress: string;
  @ApiProperty() @IsString() @Length(2, 100) city: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiProperty() @IsPostalCode('IN') pincode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
}
export class PosBillDto {
  @ApiPropertyOptional({ type: PosCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerDto)
  customer?: PosCustomerDto;
  @ApiPropertyOptional({ type: PosAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosAddressDto)
  shippingAddress?: PosAddressDto;
  @ApiProperty({ type: [PosItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items: PosItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
  @ApiProperty({ enum: PosPaymentMethodType })
  @IsEnum(PosPaymentMethodType)
  paymentMethod: PosPaymentMethodType;
  @ApiPropertyOptional({ enum: PosPaymentStatusType })
  @IsOptional()
  @IsEnum(PosPaymentStatusType)
  paymentStatus?: PosPaymentStatusType;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountReceived?: number;
}
export class PosListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: PosPaymentMethodType })
  @IsOptional()
  @IsEnum(PosPaymentMethodType)
  paymentMethod?: PosPaymentMethodType;
  @ApiPropertyOptional({ enum: PosPaymentStatusType })
  @IsOptional()
  @IsEnum(PosPaymentStatusType)
  paymentStatus?: PosPaymentStatusType;
}
