import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({ example: 'ATM Crackers Sivakasi' })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  @Transform(trim)
  storeName?: string;

  @ApiPropertyOptional({ example: 'Premium Festive Fireworks & Wholesale' })
  @IsOptional()
  @IsString()
  @Length(0, 250)
  @Transform(trim)
  tagline?: string;

  @ApiPropertyOptional({ example: '33AAAAA0000A1Z5' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z0-9]{13}$/, {
    message: 'GSTIN must be a valid 15-character GSTIN',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  gstin?: string;

  @ApiPropertyOptional({
    example: ['+91 94431 88990', '+91 98765 43210'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Length(7, 25, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((phone) => (typeof phone === 'string' ? phone.trim() : phone))
      : value,
  )
  supportPhones?: string[];

  @ApiPropertyOptional({ example: '128, By-Pass Road, Sivakasi' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  @Transform(trim)
  address?: string;

  @ApiPropertyOptional({ example: 'Thank you for shopping with ATM Crackers!' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  @Transform(trim)
  receiptFooterMessage?: string;
}
