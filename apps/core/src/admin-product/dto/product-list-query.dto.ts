import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CommonStatusType,
  StockStatusType,
} from '@libs/contracts/enums/common.enum';

export class ProductListQueryDto {
  @ApiPropertyOptional({ example: 'sound' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: '6aa6631c77e6d332b3ea5425' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CommonStatusType })
  @IsOptional()
  @IsEnum(CommonStatusType)
  status?: CommonStatusType;

  @ApiPropertyOptional({ enum: StockStatusType })
  @IsOptional()
  @IsEnum(StockStatusType)
  stockStatus?: StockStatusType;
}
