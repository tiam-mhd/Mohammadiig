export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: 'IRR';
  category: string;
  image: string | null;
  isFeatured: boolean;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
