import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Package, Truck, MapPin, User, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useProductById } from '@/hooks/useProducts';
import { formatPrice, calculateDeliveryFee } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { DeliveryType } from '@/types';

const steps = [
  { id: 1, label: 'Contact', icon: User },
  { id: 2, label: 'Delivery', icon: Truck },
  { id: 3, label: 'Review', icon: Package },
  { id: 4, label: 'Done', icon: Check },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { items, total, clearCart, addToCart, getItemQuantity } = useCart();
  const createOrder = useCreateOrder();
  const [currentStep, setCurrentStep] = useState(1);
  const buyNowProductId = searchParams.get('product');
  const { data: buyNowProduct } = useProductById(buyNowProductId || '');
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    deliveryType: 'COURIER' as DeliveryType,
    city: '',
    address: '',
    comment: '',
  });

  const [orderId, setOrderId] = useState<string | null>(null);
  const deliveryFee = formData.deliveryType === 'COURIER' ? calculateDeliveryFee(total) : 0;
  const totalWithDelivery = total + deliveryFee;

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
          return false;
        }
        if (!formData.phone.trim()) {
          toast({ title: 'Error', description: 'Please enter your phone number', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (formData.deliveryType === 'COURIER') {
          if (!formData.city.trim()) {
            toast({ title: 'Error', description: 'Please enter your city', variant: 'destructive' });
            return false;
          }
          if (!formData.address.trim()) {
            toast({ title: 'Error', description: 'Please enter your address', variant: 'destructive' });
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      toast({ title: 'Error', description: 'Your cart is empty', variant: 'destructive' });
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        delivery_type: formData.deliveryType,
        city: formData.city || undefined,
        address: formData.address || undefined,
        comment: formData.comment || undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          title_snapshot: item.product?.title || 'Product',
          price_snapshot: item.price_at_add,
          quantity: item.quantity,
        })),
      });

      setOrderId(order.id);
      clearCart();
      setCurrentStep(4);
      toast({ title: 'Order placed!', description: `Order #${order.id.slice(0, 8)} created successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!buyNowProductId || !buyNowProduct) return;
    if (!buyNowProduct.is_available || buyNowProduct.stock_count <= 0) {
      toast({ title: 'Unavailable', description: 'This item is out of stock', variant: 'destructive' });
      return;
    }

    if (getItemQuantity(buyNowProduct.id) === 0) {
      addToCart({ product: buyNowProduct, quantity: 1 });
    }
  }, [buyNowProductId, buyNowProduct, addToCart, getItemQuantity]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to checkout</h1>
        <Button asChild>
          <Link to="/auth/login?redirect=/checkout">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 4) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button asChild>
          <Link to="/catalog">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              animate={{
                scale: currentStep >= step.id ? 1 : 0.9,
                opacity: currentStep >= step.id ? 1 : 0.5,
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id
                  ? currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </motion.div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-success' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="glass-card rounded-2xl p-6"
      >
        {/* Step 1: Contact Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Contact Information</h2>
              <p className="text-muted-foreground text-sm">How can we reach you about your order?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+380 XX XXX XXXX"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Delivery */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Delivery Method</h2>
              <p className="text-muted-foreground text-sm">How would you like to receive your order?</p>
            </div>

            <RadioGroup
              value={formData.deliveryType}
              onValueChange={(v) => updateField('deliveryType', v)}
              className="space-y-3"
            >
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value="COURIER" id="courier" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4" />
                    Courier Delivery
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Free delivery to your doorstep
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value="PICKUP" id="pickup" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4" />
                    Store Pickup
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pick up from our location
                  </p>
                </div>
              </label>
            </RadioGroup>

            {formData.deliveryType === 'COURIER' && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Kyiv"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Street, building, apartment"
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="comment">Order Comment (optional)</Label>
              <div className="relative mt-1.5">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => updateField('comment', e.target.value)}
                  placeholder="Any special instructions..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Review Your Order</h2>
              <p className="text-muted-foreground text-sm">Please confirm your order details</p>
            </div>

            {/* Contact summary */}
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-medium mb-2">Contact</h4>
              <p className="text-sm">{formData.name}</p>
              <p className="text-sm text-muted-foreground">{formData.phone}</p>
            </div>

            {/* Delivery summary */}
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-medium mb-2">Delivery</h4>
              <p className="text-sm">{formData.deliveryType === 'COURIER' ? 'Courier Delivery' : 'Store Pickup'}</p>
              {formData.deliveryType === 'COURIER' && (
                <p className="text-sm text-muted-foreground">
                  {formData.city}, {formData.address}
                </p>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-3">Items ({items.length})</h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.svg'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product?.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price_at_add * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryFee === 0 ? 'text-success' : ''}>
                  {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(totalWithDelivery)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your order #{orderId?.slice(0, 8)} has been placed.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/orders">View Orders</Link>
              </Button>
              <Button className="btn-primary-gradient" asChild>
                <Link to="/catalog">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between pt-6 mt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? () => navigate('/cart') : prevStep}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Back to Cart' : 'Back'}
            </Button>

            {currentStep === 3 ? (
              <Button
                className="btn-primary-gradient"
                onClick={handleSubmit}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            ) : (
              <Button className="btn-primary-gradient" onClick={nextStep}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
