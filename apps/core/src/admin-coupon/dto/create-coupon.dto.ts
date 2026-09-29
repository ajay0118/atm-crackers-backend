import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';
import {
  CouponDiscountType,
  CouponStatus,
} from '@libs/contracts/enums/common.enum';

export class CreateCouponDto {
  @ApiProperty({ example: 'DIWALI500' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 40)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;
  @ApiPropertyOptional({ example: 'Flat Diwali discount' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  description?: string;
  @ApiProperty({ enum: CouponDiscountType })
  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;
  @ApiProperty({ example: 500, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountValue: number;
  @ApiPropertyOptional({ example: 5000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderValue?: number;
  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumDiscount?: number;
  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perCustomerLimit?: number;
  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startAt: Date;
  @ApiProperty({ example: '2026-11-15T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  expiresAt: Date;
  @ApiPropertyOptional({ enum: CouponStatus, default: CouponStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}
