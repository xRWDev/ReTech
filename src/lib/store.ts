import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, FilterState, ProductCategory, ProductCondition } from '@/types';

// Local cart store for guests
interface LocalCartItem {
  productId: string;
  quantity: number;
  priceAtAdd: number;
  product?: Product;
}

interface LocalCartStore {
  items: LocalCartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useLocalCartStore = create<LocalCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, {
              productId: product.id,
              quantity,
              priceAtAdd: product.price,
              product,
            }],
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
        } else {
          set({
            items: get().items.map(item =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'retech-cart',
    }
  )
);

// Recently viewed products store
interface RecentlyViewedStore {
  products: Product[];
  addProduct: (product: Product) => void;
  clearAll: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const products = get().products.filter(p => p.id !== product.id);
        set({ products: [product, ...products].slice(0, 10) });
      },
      clearAll: () => set({ products: [] }),
    }),
    {
      name: 'retech-recently-viewed',
    }
  )
);

// Filter state store
interface FilterStore {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleCategory: (category: ProductCategory) => void;
  toggleBrand: (brand: string) => void;
  toggleCondition: (condition: ProductCondition) => void;
  toggleCity: (city: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  categories: [],
  brands: [],
  priceRange: [0, 100000],
  conditions: [],
  cities: [],
  warrantyMonths: null,
  inStockOnly: false,
  sortBy: 'popular',
  search: '',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: defaultFilters,
  setFilter: (key, value) => {
    set({ filters: { ...get().filters, [key]: value } });
  },
  toggleCategory: (category) => {
    const current = get().filters.categories;
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    set({ filters: { ...get().filters, categories: updated } });
  },
  toggleBrand: (brand) => {
    const current = get().filters.brands;
    const updated = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand];
    set({ filters: { ...get().filters, brands: updated } });
  },
  toggleCondition: (condition) => {
    const current = get().filters.conditions;
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    set({ filters: { ...get().filters, conditions: updated } });
  },
  toggleCity: (city) => {
    const current = get().filters.cities;
    const updated = current.includes(city)
      ? current.filter(c => c !== city)
      : [...current, city];
    set({ filters: { ...get().filters, cities: updated } });
  },
  resetFilters: () => set({ filters: defaultFilters }),
}));

// UI state store
interface UIStore {
  isCartOpen: boolean;
  isFiltersOpen: boolean;
  isMobileMenuOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  isFiltersOpen: false,
  isMobileMenuOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  setFiltersOpen: (open) => set({ isFiltersOpen: open }),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));
