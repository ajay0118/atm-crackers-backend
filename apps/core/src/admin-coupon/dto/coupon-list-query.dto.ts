import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CouponStatus } from '@libs/contracts/enums/common.enum';
export class CouponListQueryDto {
  @ApiPropertyOptional({ enum: CouponStatus })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
  @ApiPropertyOptional({ example: 'DIWALI' })
  @IsOptional()
  @IsString()
  search?: string;
}
