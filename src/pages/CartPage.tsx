import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { formatPrice, calculateDeliveryFee } from '@/lib/utils';

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const deliveryFee = calculateDeliveryFee(total);
  const totalWithDelivery = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Looks like you haven't added any products yet. Start shopping to fill your cart!
          </p>
          <Button size="lg" className="btn-primary-gradient" asChild>
            <Link to="/catalog">
              Start Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" size="sm" onClick={() => clearCart()}>
          Clear All
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const maxQty = item.product?.stock_count ?? item.quantity;
              return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass-card rounded-2xl p-4 flex gap-4"
              >
                {/* Image */}
                <Link to={`/product/${item.product?.slug}`} className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={item.product?.images?.[0] || '/placeholder.svg'}
                      alt={item.product?.title || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product?.slug}`}>
                    <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                      {item.product?.title || 'Product'}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.product?.brand} &bull; {item.product?.condition === 'A' ? 'Excellent' : item.product?.condition === 'B' ? 'Good' : 'Fair'}
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    {formatPrice(item.price_at_add)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity({ productId: item.product_id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity({ productId: item.product_id, quantity: item.quantity + 1 })}
                      disabled={item.quantity >= maxQty}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div>
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

            {/* Promo code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  disabled
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted text-muted-foreground text-sm"
                />
                <Button variant="outline" disabled>
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryFee === 0 ? 'text-success' : ''}>
                  {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>{formatPrice(totalWithDelivery)}</span>
            </div>

            <Button className="w-full btn-primary-gradient" size="lg" asChild>
              <Link to={user ? '/checkout' : '/auth/login?redirect=/checkout'}>
                Proceed to Checkout
              </Link>
            </Button>

            {!user && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                You'll need to sign in to complete your order
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
