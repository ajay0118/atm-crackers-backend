import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CommonStatusType,
  OfferScopeType,
} from '@libs/contracts/enums/common.enum';
export class OfferListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: CommonStatusType })
  @IsOptional()
  @IsEnum(CommonStatusType)
  status?: CommonStatusType;
  @ApiPropertyOptional({ enum: OfferScopeType })
  @IsOptional()
  @IsEnum(OfferScopeType)
  scope?: OfferScopeType;
}
