// ReTech Types

export type ProductCategory = 'smartphones' | 'laptops' | 'tablets' | 'accessories' | 'gaming' | 'audio' | 'monitors';

export type ProductCondition = 'A' | 'B' | 'C';

export type OrderStatus = 'NEW' | 'PAID' | 'SHIPPED' | 'DONE' | 'CANCELLED';

export type DeliveryType = 'COURIER' | 'PICKUP';

export type UserRole = 'user' | 'admin';

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  brand: string;
  model: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  condition: ProductCondition;
  storage: string | null;
  ram: string | null;
  cpu: string | null;
  gpu: string | null;
  screen_size: string | null;
  battery_health: number | null;
  color: string | null;
  location_city: string;
  warranty_months: number;
  description: string | null;
  images: string[];
  is_available: boolean;
  stock_count: number;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_at_add: number;
  created_at: string;
  product?: Product;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: number;
  currency: string;
  delivery_type: DeliveryType;
  city: string | null;
  address: string | null;
  name: string;
  phone: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  title_snapshot: string;
  price_snapshot: number;
  quantity: number;
  created_at: string;
}

export interface FilterState {
  categories: ProductCategory[];
  brands: string[];
  priceRange: [number, number];
  conditions: ProductCondition[];
  cities: string[];
  warrantyMonths: number | null;
  inStockOnly: boolean;
  sortBy: 'popular' | 'newest' | 'price_asc' | 'price_desc';
  search: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  tablets: 'Tablets',
  accessories: 'Accessories',
  gaming: 'Gaming',
  audio: 'Audio',
  monitors: 'Monitors',
};

export const CONDITION_LABELS: Record<ProductCondition, { label: string; description: string }> = {
  A: { label: 'Excellent', description: 'Like new, minimal signs of use' },
  B: { label: 'Good', description: 'Minor cosmetic wear, fully functional' },
  C: { label: 'Fair', description: 'Visible wear, fully functional' },
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DONE: 'Completed',
  CANCELLED: 'Cancelled',
};
