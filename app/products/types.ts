export interface IProduct {
  id: string;
  images: string[];
  name: string;
  description: string;

  brand: string;
  discount: number;
  originalPrice: number;
  price: number;
  inStock: boolean;
  isNew: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  totalStock: number;
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
