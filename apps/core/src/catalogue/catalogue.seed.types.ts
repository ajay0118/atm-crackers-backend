import { ProductUnitType } from '@libs/contracts/enums/common.enum';

export interface CatalogueSeedProduct {
  name: string;
  unit?: string | ProductUnitType;
  mrp: number;
  displayOrder?: number;
}

export interface CatalogueSeedCategory {
  name: string;
  displayOrder?: number;
  products: CatalogueSeedProduct[];
}

export interface CatalogueSeedFile {
  defaults?: {
    categoryImageUrl: string;
    productImageUrl: string;
  };
  categories: CatalogueSeedCategory[];
}
