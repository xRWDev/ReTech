import { Link, useLocation } from 'react-router-dom';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Headphones, 
  Gamepad2, 
  Speaker, 
  Monitor,
  Home,
  ShoppingBag,
  User,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useFilterStore } from '@/lib/store';
import type { ProductCategory } from '@/types';

interface SidebarProps {
  className?: string;
}

const categoryIcons: Record<ProductCategory, typeof Smartphone> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  accessories: Headphones,
  gaming: Gamepad2,
  audio: Speaker,
  monitors: Monitor,
};

const categoryLabels: Record<ProductCategory, string> = {
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  tablets: 'Tablets',
  accessories: 'Accessories',
  gaming: 'Gaming',
  audio: 'Audio',
  monitors: 'Monitors',
};

const categories: ProductCategory[] = [
  'smartphones',
  'laptops',
  'tablets',
  'accessories',
  'gaming',
  'audio',
  'monitors',
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { setFilter, resetFilters, filters } = useFilterStore();

  const handleCategoryClick = (category: ProductCategory) => {
    resetFilters();
    setFilter('categories', [category]);
  };

  return (
    <aside className={cn(
      'w-64 flex-shrink-0 border-r border-border/50 bg-sidebar h-[calc(100vh-64px)] sticky top-16',
      className
    )}>
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/catalog"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/catalog' && filters.categories.length === 0
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            All Products
          </Link>
        </nav>

        {/* Categories */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Categories
          </h3>
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const isActive = filters.categories.includes(category);
              
              return (
                <Link
                  key={category}
                  to={`/catalog?category=${category}`}
                  onClick={() => handleCategoryClick(category)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {categoryLabels[category]}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </h3>
          <nav className="space-y-1">
            <Link
              to="/profile"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                location.pathname === '/profile'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link
              to="/orders"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                location.pathname === '/orders'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              My Orders
            </Link>
          </nav>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Admin
            </h3>
            <nav className="space-y-1">
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  location.pathname === '/admin'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Settings className="w-5 h-5" />
                Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
