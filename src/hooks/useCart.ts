import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useLocalCartStore } from '@/lib/store';
import type { Cart, CartItem, Product } from '@/types';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Server-backed cart operations
export function useCart() {
  const { user } = useAuth();
  const localCart = useLocalCartStore();
  const queryClient = useQueryClient();

  const updateServerCartCache = (
    updater: (cart: Cart & { items: (CartItem & { product: Product })[] }) => Cart & { items: (CartItem & { product: Product })[] }
  ) => {
    if (!user) return;
    queryClient.setQueryData(['cart', user.id], (current) => {
      if (!current) return current;
      return updater(current as Cart & { items: (CartItem & { product: Product })[] });
    });
  };

  // Fetch server cart for logged-in users
  const serverCartQuery = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cartError) throw cartError;
      if (!cart) return null;

      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('cart_id', cart.id);

      if (itemsError) throw itemsError;

      return {
        ...cart,
        items: items.map(item => ({
          ...item,
          product: item.product as Product,
        })),
      } as Cart & { items: (CartItem & { product: Product })[] };
    },
    enabled: !!user,
  });

  // Migrate local cart to server on login
  useEffect(() => {
    if (user && localCart.items.length > 0 && serverCartQuery.data) {
      const migrateCart = async () => {
        for (const item of localCart.items) {
          await supabase.from('cart_items').upsert({
            cart_id: serverCartQuery.data.id,
            product_id: item.productId,
            quantity: item.quantity,
            price_at_add: item.priceAtAdd,
          }, {
            onConflict: 'cart_id,product_id',
          });
        }
        localCart.clearCart();
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      };
      migrateCart();
    }
  }, [user, serverCartQuery.data?.id]);

  // Add to cart mutation
  const addToCart = useMutation({
    mutationFn: async ({ product, quantity = 1 }: { product: Product; quantity?: number }) => {
      if (!user || !serverCartQuery.data) {
        localCart.addItem(product, quantity);
        return;
      }

      const existingItem = serverCartQuery.data.items.find(item => item.product_id === product.id);
      const nextQuantity = Math.min(
        (existingItem?.quantity ?? 0) + quantity,
        product.stock_count ?? Number.MAX_SAFE_INTEGER
      );

      await supabase.from('cart_items').upsert(
        {
          cart_id: serverCartQuery.data.id,
          product_id: product.id,
          quantity: nextQuantity,
          price_at_add: product.price,
        },
        {
          onConflict: 'cart_id,product_id',
        }
      );
    },
    onMutate: async ({ product, quantity = 1 }) => {
      if (!user || !serverCartQuery.data) return;
      await queryClient.cancelQueries({ queryKey: ['cart', user.id] });
      const previous = queryClient.getQueryData(['cart', user.id]);

      updateServerCartCache((cart) => {
        const existing = cart.items.find(item => item.product_id === product.id);
        const nextQuantity = Math.min(
          (existing?.quantity ?? 0) + quantity,
          product.stock_count ?? Number.MAX_SAFE_INTEGER
        );

        if (existing) {
          return {
            ...cart,
            items: cart.items.map(item =>
              item.product_id === product.id
                ? { ...item, quantity: nextQuantity }
                : item
            ),
          };
        }

        return {
          ...cart,
          items: [
            ...cart.items,
            {
              id: `temp-${product.id}`,
              cart_id: cart.id,
              product_id: product.id,
              quantity: nextQuantity,
              price_at_add: product.price,
              created_at: new Date().toISOString(),
              product,
            },
          ],
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && user) {
        queryClient.setQueryData(['cart', user.id], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Removed from cart' });
    },
  });

  // Update quantity mutation
  const updateQuantity = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (!user || !serverCartQuery.data) {
        localCart.updateQuantity(productId, quantity);
        return;
      }

      if (quantity <= 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', serverCartQuery.data.id)
          .eq('product_id', productId);
      } else {
        await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('cart_id', serverCartQuery.data.id)
          .eq('product_id', productId);
      }
    },
    onMutate: async ({ productId, quantity }) => {
      if (!user || !serverCartQuery.data) return;
      await queryClient.cancelQueries({ queryKey: ['cart', user.id] });
      const previous = queryClient.getQueryData(['cart', user.id]);

      updateServerCartCache((cart) => {
        if (quantity <= 0) {
          return { ...cart, items: cart.items.filter(item => item.product_id !== productId) };
        }
        return {
          ...cart,
          items: cart.items.map(item =>
            item.product_id === productId ? { ...item, quantity } : item
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && user) {
        queryClient.setQueryData(['cart', user.id], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: async (productId: string) => {
      if (!user || !serverCartQuery.data) {
        localCart.removeItem(productId);
        return;
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', serverCartQuery.data.id)
        .eq('product_id', productId);
    },
    onMutate: async (productId) => {
      if (!user || !serverCartQuery.data) return;
      await queryClient.cancelQueries({ queryKey: ['cart', user.id] });
      const previous = queryClient.getQueryData(['cart', user.id]);

      updateServerCartCache((cart) => ({
        ...cart,
        items: cart.items.filter(item => item.product_id !== productId),
      }));

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && user) {
        queryClient.setQueryData(['cart', user.id], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Clear cart mutation
  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user || !serverCartQuery.data) {
        localCart.clearCart();
        return;
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', serverCartQuery.data.id);
    },
    onMutate: async () => {
      if (!user || !serverCartQuery.data) return;
      await queryClient.cancelQueries({ queryKey: ['cart', user.id] });
      const previous = queryClient.getQueryData(['cart', user.id]);

      updateServerCartCache((cart) => ({ ...cart, items: [] }));

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && user) {
        queryClient.setQueryData(['cart', user.id], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Combined cart data
  const cartItems = user && serverCartQuery.data
    ? serverCartQuery.data.items
    : localCart.items.map(item => ({
        id: item.productId,
        cart_id: 'local',
        product_id: item.productId,
        quantity: item.quantity,
        price_at_add: item.priceAtAdd,
        created_at: new Date().toISOString(),
        product: item.product,
      } as CartItem & { product?: Product }));

  const total = cartItems.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getItemQuantity = (productId: string) => {
    const item = cartItems.find(i => i.product_id === productId);
    return item?.quantity ?? 0;
  };

  return {
    items: cartItems,
    total,
    itemCount,
    isLoading: serverCartQuery.isLoading,
    getItemQuantity,
    addToCart: addToCart.mutate,
    updateQuantity: updateQuantity.mutate,
    removeFromCart: removeFromCart.mutate,
    clearCart: clearCart.mutate,
    isAdding: addToCart.isPending,
  };
}
