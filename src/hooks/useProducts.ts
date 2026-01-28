import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, FilterState, ProductCategory, ProductCondition } from '@/types';

// Fetch all products with optional filters
export function useProducts(filters?: Partial<FilterState>) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      // Apply filters
      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters?.brands && filters.brands.length > 0) {
        query = query.in('brand', filters.brands);
      }

      if (filters?.conditions && filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }

      if (filters?.cities && filters.cities.length > 0) {
        query = query.in('location_city', filters.cities);
      }

      if (filters?.priceRange) {
        query = query
          .gte('price', filters.priceRange[0])
          .lte('price', filters.priceRange[1]);
      }

      if (filters?.warrantyMonths !== null && filters?.warrantyMonths !== undefined) {
        query = query.gte('warranty_months', filters.warrantyMonths);
      }

      if (filters?.inStockOnly) {
        query = query.gt('stock_count', 0);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
        default:
          query = query.order('rating_count', { ascending: false, nullsFirst: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch single product by slug
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!slug,
  });
}

// Fetch single product by id
export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

// Fetch similar products
export function useSimilarProducts(productId: string, category: ProductCategory) {
  return useQuery({
    queryKey: ['similar-products', productId, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .neq('id', productId)
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!productId && !!category,
  });
}

// Fetch featured products for home page
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .not('old_price', 'is', null)
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch unique filter options from products
export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('brand, location_city, price')
        .eq('is_available', true);

      if (error) throw error;
      if (!products || products.length === 0) {
        return { brands: [], cities: [], minPrice: 0, maxPrice: 0 };
      }

      const brands = [...new Set(products.map(p => p.brand))].sort();
      const cities = [...new Set(products.map(p => p.location_city))].sort();
      const prices = products.map(p => Number(p.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return { brands, cities, minPrice, maxPrice };
    },
  });
}

// Admin: Fetch all products including unavailable
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
}

// Admin: Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// Admin: Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.slug] });
    },
  });
}

// Admin: Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}
