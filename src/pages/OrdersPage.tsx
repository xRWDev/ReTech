import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/hooks/useCart';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/types';
import type { Order, OrderItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types';

const statusColors = {
  NEW: 'status-new',
  PAID: 'status-paid',
  SHIPPED: 'status-shipped',
  DONE: 'status-done',
  CANCELLED: 'status-cancelled',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useOrders();
  const { addToCart } = useCart();
  const [reorderLoadingId, setReorderLoadingId] = useState<string | null>(null);

  const handleReorder = async (order: Order & { items?: OrderItem[] }) => {
    if (!order?.items || order.items.length === 0) {
      toast({ title: 'No items', description: 'This order has no items to reorder.' });
      return;
    }

    setReorderLoadingId(order.id);

    try {
      const productIds = order.items
        .map((item) => item.product_id)
        .filter((id): id is string => !!id);

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;

      const productMap = new Map<string, Product>(
        (products || []).map((product) => [product.id, product])
      );

      let addedCount = 0;
      let unavailableCount = 0;

      for (const item of order.items) {
        if (!item.product_id) {
          unavailableCount += 1;
          continue;
        }

        const product = productMap.get(item.product_id);
        if (!product || !product.is_available || product.stock_count <= 0) {
          unavailableCount += 1;
          continue;
        }

        const qty = Math.min(item.quantity, product.stock_count);
        if (qty <= 0) {
          unavailableCount += 1;
          continue;
        }

        addToCart({ product, quantity: qty });
        addedCount += 1;
      }

      if (addedCount > 0) {
        toast({
          title: 'Added to cart',
          description:
            unavailableCount > 0
              ? `${addedCount} items added. ${unavailableCount} unavailable.`
              : `${addedCount} items added to your cart.`,
        });
      } else {
        toast({
          title: 'No items added',
          description: 'All items from this order are unavailable.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reorder items', variant: 'destructive' });
    } finally {
      setReorderLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <Button asChild>
          <Link to="/auth/login?redirect=/orders">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-2" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">No orders yet</h1>
          <p className="text-muted-foreground mb-8">
            Start shopping to see your orders here!
          </p>
          <Button className="btn-primary-gradient" asChild>
            <Link to="/catalog">Browse Products</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <Badge className={cn('status-badge', statusColors[order.status])}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            {/* Items preview */}
            <div className="flex items-center gap-2 mb-3 overflow-hidden">
              {order.items?.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden"
                >
                  {/* Would need product images stored in order items */}
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <span className="text-sm text-muted-foreground">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {order.items?.length || 0} items &bull; {order.delivery_type === 'COURIER' ? 'Delivery' : 'Pickup'}
                </p>
                <p className="font-semibold">{formatPrice(Number(order.total))}</p>
              </div>

              <div className="flex items-center gap-2">
                {order.status !== 'CANCELLED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(order)}
                    disabled={reorderLoadingId === order.id}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {reorderLoadingId === order.id ? 'Reordering...' : 'Reorder'}
                  </Button>
                )}
              </div>
            </div>

            {/* Order details */}
            <details className="mt-4">
              <summary className="text-sm text-primary cursor-pointer hover:underline">
                View Details
              </summary>
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.title_snapshot} x {item.quantity}
                    </span>
                    <span>{formatPrice(Number(item.price_snapshot) * item.quantity)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(Number(order.total))}</span>
                </div>
                {order.address && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Delivery to: {order.city}, {order.address}
                  </p>
                )}
              </div>
            </details>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
