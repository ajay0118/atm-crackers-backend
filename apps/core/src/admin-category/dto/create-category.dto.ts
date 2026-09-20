import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { CommonStatusType } from '@libs/contracts/enums/common.enum';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Double Sound Effect', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    example: 'double-sound-effect',
    description: 'Lowercase URL-safe slug. Generated from name when omitted.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must contain only lowercase letters, numbers, and single hyphens',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiPropertyOptional({ example: 'Double sound crackers' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/category.jpg' })
  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  imageUrl?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    enum: CommonStatusType,
    default: CommonStatusType.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CommonStatusType)
  status?: CommonStatusType;
}
