import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by product name, slug, or description',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter products by category id or slug',
  })
  category?: string;
}
