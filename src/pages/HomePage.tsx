import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useRecentlyViewedStore, useFilterStore } from '@/lib/store';
import type { ProductCategory } from '@/types';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Headphones, 
  Gamepad2, 
  Speaker, 
  Monitor 
} from 'lucide-react';

const categories: { id: ProductCategory; label: string; icon: typeof Smartphone }[] = [
  { id: 'smartphones', label: 'Phones', icon: Smartphone },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'tablets', label: 'Tablets', icon: Tablet },
  { id: 'accessories', label: 'Accessories', icon: Headphones },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'audio', label: 'Audio', icon: Speaker },
  { id: 'monitors', label: 'Monitors', icon: Monitor },
];

const features = [
  { icon: Shield, label: 'Quality Guaranteed', desc: 'All devices tested' },
  { icon: Truck, label: 'Fast Delivery', desc: 'Free shipping' },
  { icon: RefreshCw, label: 'Easy Returns', desc: '14-day policy' },
];

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();
  const { products: recentlyViewed } = useRecentlyViewedStore();
  const { setFilter, resetFilters } = useFilterStore();

  const handleCategoryClick = (category: ProductCategory) => {
    resetFilters();
    setFilter('categories', [category]);
  };

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <section className="relative hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        {/* Animated blobs */}
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 -right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Premium Used Electronics
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Tech That's{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Better
              </span>{' '}
              The Second Time
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Discover certified pre-owned smartphones, laptops, and gadgets. 
              Quality tested, warranty included, sustainably renewed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="btn-primary-gradient" asChild>
                <Link to="/catalog">
                  Browse Catalog
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="glass-card" asChild>
                <Link to="/catalog?category=smartphones">
                  Shop Phones
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="py-4 px-2 lg:px-6 text-center"
              >
                <feature.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-xs lg:text-sm font-medium">{feature.label}</p>
                <p className="text-xs text-muted-foreground hidden lg:block">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/catalog?category=${cat.id}`}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:shadow-lg transition-all group"
              >
                <div className="category-icon group-hover:scale-110 transition-transform">
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-center">{cat.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hot Deals */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Hot Deals</h2>
          <Button variant="ghost" asChild>
            <Link to="/catalog">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-64 flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : featuredProducts?.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-64 flex-shrink-0"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {recentlyViewed.slice(0, 6).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-56 flex-shrink-0"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-8 lg:p-12"
        >
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Sell Your Old Device
            </h2>
            <p className="text-white/80 mb-6">
              Get the best price for your used electronics. Fast evaluation, instant offer.
            </p>
            <Button variant="secondary" size="lg">
              Get a Quote
            </Button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
            <Smartphone className="w-full h-full" />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
