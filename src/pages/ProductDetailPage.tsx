import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  ShoppingCart, 
  Minus, 
  Plus,
  Shield,
  MapPin,
  Battery,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard';
import { useProduct, useSimilarProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useRecentlyViewedStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';
import { CONDITION_LABELS } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { data: similarProducts } = useSimilarProducts(product?.id || '', product?.category || 'smartphones');
  const { addToCart, getItemQuantity, updateQuantity, isAdding } = useCart();
  const { addProduct } = useRecentlyViewedStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const inCartQty = product ? getItemQuantity(product.id) : 0;

  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product?.id]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || !product) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - touchEndX;
    const threshold = 50;

    if (Math.abs(delta) > threshold && product.images.length > 1) {
      if (delta > 0) {
        setCurrentImageIndex((i) => (i < product.images.length - 1 ? i + 1 : 0));
      } else {
        setCurrentImageIndex((i) => (i > 0 ? i - 1 : product.images.length - 1));
      }
    }

    touchStartX.current = null;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ product, quantity: 1 });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    toast({
      title: 'Added to cart',
      description: product.title,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Share',
        description: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-6 w-1/2 bg-muted rounded" />
              <div className="h-12 w-1/3 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => navigate('/catalog')}>Back to Catalog</Button>
      </div>
    );
  }

  const specs = [
    product.storage && { icon: HardDrive, label: 'Storage', value: product.storage },
    product.ram && { icon: Cpu, label: 'RAM', value: product.ram },
    product.cpu && { icon: Zap, label: 'CPU', value: product.cpu },
    product.gpu && { icon: Monitor, label: 'GPU', value: product.gpu },
    product.screen_size && { icon: Monitor, label: 'Screen', value: product.screen_size },
    product.battery_health && { icon: Battery, label: 'Battery', value: `${product.battery_health}%` },
  ].filter(Boolean) as { icon: typeof Cpu; label: string; value: string }[];

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div
            className="relative aspect-square rounded-3xl overflow-hidden glass-card"
            layoutId={`product-image-${product.id}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={product.images[currentImageIndex] || '/placeholder.svg'}
                alt={product.title}
                className="w-full h-full object-cover cursor-zoom-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsZoomOpen(true)}
              />
            </AnimatePresence>

            {/* Navigation arrows */}
            {product.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full glass-card-strong"
                  onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : product.images.length - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full glass-card-strong"
                  onClick={() => setCurrentImageIndex((i) => (i < product.images.length - 1 ? i + 1 : 0))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount && (
                <Badge variant="destructive">-{discount}%</Badge>
              )}
            </div>
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0',
                    i === currentImageIndex
                      ? 'border-primary'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand & Title */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              {product.brand}
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.title}</h1>
            
            {/* Condition badge with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    'cursor-help',
                    product.condition === 'A' && 'condition-badge-a',
                    product.condition === 'B' && 'condition-badge-b',
                    product.condition === 'C' && 'condition-badge-c'
                  )}
                >
                  {CONDITION_LABELS[product.condition].label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{CONDITION_LABELS[product.condition].description}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.old_price && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          {/* Location & Warranty */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {product.location_city}
            </div>
            {product.warranty_months > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                {product.warranty_months} months warranty
              </div>
            )}
          </div>

          {/* Stock */}
          {product.stock_count > 0 ? (
            <p className="text-sm text-success flex items-center gap-1">
              <Check className="w-4 h-4" />
              In stock ({product.stock_count} available)
            </p>
          ) : (
            <p className="text-sm text-destructive">Out of stock</p>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-3">
            {inCartQty > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 glass-card rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => updateQuantity({ productId: product.id, quantity: inCartQty - 1 })}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center">{inCartQty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => updateQuantity({ productId: product.id, quantity: inCartQty + 1 })}
                    disabled={inCartQty >= product.stock_count}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/cart">View Cart</Link>
                </Button>
              </div>
            ) : (
              <motion.div
                animate={addedToCart ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Button
                  size="lg"
                  className="btn-primary-gradient"
                  onClick={handleAddToCart}
                  disabled={!product.is_available || product.stock_count === 0 || isAdding}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </motion.div>
            )}

            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Buy Now */}
          <Button variant="outline" className="w-full" size="lg" asChild>
            <Link to={`/checkout?product=${product.id}`}>
              Buy Now
            </Link>
          </Button>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Specifications</h3>
              <div className="glass-card rounded-2xl divide-y divide-border">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center gap-3 p-3">
                    <spec.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{spec.label}</span>
                    <span className="text-sm font-medium ml-auto">{spec.value}</span>
                  </div>
                ))}
                {product.color && (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-5 h-5 rounded-full bg-muted" />
                    <span className="text-sm text-muted-foreground">Color</span>
                    <span className="text-sm font-medium ml-auto">{product.color}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts && similarProducts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Similar Products</h2>
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {similarProducts.map((p) => (
                <div key={p.id} className="w-56 flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="w-full h-full bg-black/90 flex items-center justify-center">
            <img
              src={product.images[currentImageIndex] || '/placeholder.svg'}
              alt={product.title}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
