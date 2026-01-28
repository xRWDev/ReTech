import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/store';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { formatPrice, calculateDeliveryFee } from '@/lib/utils';

export function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items, total, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const deliveryFee = calculateDeliveryFee(total);
  const totalWithDelivery = total + deliveryFee;

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md glass-card-strong border-l-0">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start adding some awesome tech!
            </p>
            <Button onClick={() => setCartOpen(false)} asChild>
              <Link to="/catalog">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-280px)] pr-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const maxQty = item.product?.stock_count ?? item.quantity;
                  return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 py-4"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.svg'}
                        alt={item.product?.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.product?.title || 'Product'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(item.price_at_add)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity({ 
                            productId: item.product_id, 
                            quantity: item.quantity - 1 
                          })}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity({ 
                            productId: item.product_id, 
                            quantity: item.quantity + 1 
                          })}
                          disabled={item.quantity >= maxQty}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </AnimatePresence>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
              <Separator className="mb-4" />
              
              {/* Promo code - coming soon */}
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

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
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
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalWithDelivery)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <Button
                className="w-full btn-primary-gradient"
                size="lg"
                asChild
                onClick={() => setCartOpen(false)}
              >
                <Link to={user ? '/checkout' : '/auth/login?redirect=/checkout'}>
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
