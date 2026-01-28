import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';

interface BottomNavProps {
  className?: string;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3X3, label: 'Catalog', path: '/catalog' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart', showBadge: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { itemCount } = useCart();

  const items = isAdmin
    ? [...navItems, { icon: Shield, label: 'Admin', path: '/admin' }]
    : navItems;

  return (
    <nav className={cn('bottom-nav safe-bottom', className)}>
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'bottom-nav-item relative',
                isActive && 'active'
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.showBadge && itemCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {itemCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
