import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  CommonStatusType,
  OfferScopeType,
} from '@libs/contracts/enums/common.enum';

export class CreateOfferDto {
  @ApiProperty({ example: 'DIWALI 2026' })
  @IsString()
  @Length(2, 100)
  name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  description?: string;
  @ApiProperty({ example: 90, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent: number;
  @ApiProperty({ enum: OfferScopeType })
  @IsEnum(OfferScopeType)
  scope: OfferScopeType;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startAt: Date;
  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  expiresAt: Date;
  @ApiPropertyOptional({ enum: CommonStatusType })
  @IsOptional()
  @IsEnum(CommonStatusType)
  status?: CommonStatusType;
}
