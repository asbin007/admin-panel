export interface IProduct {
  id: string;
  images: string[];
  name: string;
  description: string;

  brand: string;
  discount: number;
  originalPrice: number;
  price: number;
  costPrice?: number; // Cost price for profit calculation (admin only)
  inStock: boolean;
  isNew: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  totalStock: number;
  totalQuantitySold?: number; // Total quantity sold for analytics
  totalRevenue?: number; // Total revenue for analytics
  createdAt: string;
  features: string[] |string;
  colors: string[]| string;
  sizes: string[] |string;
  Category: {
    id: string;
    categoryName: string;
  };
  Collection: {
    id: string;
    collectionName: string;
  };
}
