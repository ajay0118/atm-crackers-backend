export interface CatalogueSeedProduct {
  name: string;
  unit: string;
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
