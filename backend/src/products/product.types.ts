export interface Product {
  id: string;
  name: string;
  nameEn: string;
  sku: string;
  slug: string;
  description: string;
  descriptionLong: string | null;
  price: number;
  currency: 'IRR';
  category: string;
  /** Primary image (first gallery item) for cards/listings. */
  image: string | null;
  /** Full product image gallery. */
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  /** ISO timestamp when soft-deleted; null if active. */
  deletedAt: string | null;
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
