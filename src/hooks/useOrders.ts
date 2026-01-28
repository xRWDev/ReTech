import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { calculateDeliveryFee } from '@/lib/utils';
import type { Order, OrderItem, DeliveryType, OrderStatus } from '@/types';

interface CreateOrderData {
  name: string;
  phone: string;
  delivery_type: DeliveryType;
  city?: string;
  address?: string;
  comment?: string;
  items: {
    product_id: string;
    title_snapshot: string;
    price_snapshot: number;
    quantity: number;
  }[];
}

// Fetch user orders
export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
    enabled: !!user,
  });
}

// Fetch single order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as Order & { items: OrderItem[] };
    },
    enabled: !!orderId,
  });
}

// Create order
export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (!user) throw new Error('Must be logged in to create order');

      const subtotal = data.items.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0
      );
      const deliveryFee = data.delivery_type === 'COURIER' ? calculateDeliveryFee(subtotal) : 0;
      const total = subtotal + deliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          name: data.name,
          phone: data.phone,
          delivery_type: data.delivery_type,
          city: data.city,
          address: data.address,
          comment: data.comment,
          total,
          status: 'NEW' as OrderStatus,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          data.items.map(item => ({
            order_id: order.id,
            ...item,
          }))
        );

      if (itemsError) throw itemsError;

      // Update stock counts via RPC (bypasses RLS)
      const { error: stockError } = await supabase.rpc('adjust_stock', {
        items: data.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        increase: false,
      });

      if (stockError) throw stockError;

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Admin: Fetch all orders
export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
  });
}

// Admin: Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // If cancelling, restore stock
      if (status === 'CANCELLED') {
        const { data: order, error: itemsError } = await supabase
          .from('orders')
          .select(`items:order_items(product_id, quantity)`)
          .eq('id', orderId)
          .single();

        if (itemsError) throw itemsError;

        if (order?.items && order.items.length > 0) {
          const { error: restockError } = await supabase.rpc('adjust_stock', {
            items: order.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
            increase: true,
          });

          if (restockError) throw restockError;
        }
      }

      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
