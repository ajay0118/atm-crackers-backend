import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Min,
  MinLength,
  IsNumber,
  Max,
} from 'class-validator';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';

export class CreateProductDto {
  @ApiProperty({ example: '6aa6631c77e6d332b3ea5425' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @ApiProperty({ example: 'Three Sound', minLength: 2, maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ example: 'three-sound' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiPropertyOptional({ example: 'Three sound cracker' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/product.jpg'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({ example: 600, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mrp: number;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent: number;

  @ApiPropertyOptional({
    enum: StockStatusType,
    default: StockStatusType.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(StockStatusType)
  stockStatus?: StockStatusType;

  @ApiPropertyOptional({
    enum: CommonStatusType,
    default: CommonStatusType.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CommonStatusType)
  status?: CommonStatusType;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
