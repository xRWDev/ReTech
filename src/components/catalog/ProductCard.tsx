import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useRecentlyViewedStore } from '@/lib/store';
import type { Product } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart, getItemQuantity } = useCart();
  const { addProduct } = useRecentlyViewedStore();
  const inCartQty = getItemQuantity(product.id);

  const handleClick = () => {
    addProduct(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ product, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: product.title,
    });
  };

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn('product-card group', className)}
    >
      <Link to={`/product/${product.slug}`} onClick={handleClick}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <Badge variant="destructive" className="text-xs">
                -{discount}%
              </Badge>
            )}
            <Badge
              className={cn(
                'text-xs',
                product.condition === 'A' && 'condition-badge-a',
                product.condition === 'B' && 'condition-badge-b',
                product.condition === 'C' && 'condition-badge-c'
              )}
            >
              {product.condition === 'A' ? 'Excellent' : product.condition === 'B' ? 'Good' : 'Fair'}
            </Badge>
          </div>

          {/* Quick add button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 right-2"
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full shadow-lg glass-card-strong"
              onClick={handleAddToCart}
              disabled={!product.is_available || product.stock_count === 0}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Brand */}
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {product.brand}
          </p>

          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Location & Warranty */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{product.location_city}</span>
            {product.warranty_months > 0 && (
              <>
                <span>&bull;</span>
                <span>{product.warranty_months} mo warranty</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="price-current">{formatPrice(product.price)}</span>
            {product.old_price && (
              <span className="price-old">{formatPrice(product.old_price)}</span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock_count <= 3 && product.stock_count > 0 && (
            <p className="text-xs text-warning">Only {product.stock_count} left</p>
          )}
          {product.stock_count === 0 && (
            <p className="text-xs text-destructive">Out of stock</p>
          )}

          {/* In cart indicator */}
          {inCartQty > 0 && (
            <Badge variant="outline" className="text-xs">
              {inCartQty} in cart
            </Badge>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton loader
export function ProductCardSkeleton() {
  return (
    <div className="product-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-5 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}
