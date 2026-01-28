import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { useUIStore, useFilterStore } from '@/lib/store';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from '@/lib/utils';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { setCartOpen } = useUIStore();
  const { setFilter } = useFilterStore();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilter('search', value);
    if (value) {
      navigate('/catalog');
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <header className="sticky top-0 z-40 glass-card-strong border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">ReTech</span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="search-bar w-full">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search phones, laptops, accessories..."
                value={searchValue}
                onChange={handleSearchChange}
                className="border-0 bg-transparent focus-visible:ring-0 px-0"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Cart button - desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden lg:flex"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                      {itemCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* Profile/Auth */}
            <Link to={user ? '/profile' : '/auth/login'}>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            {/* Admin link - desktop */}
            {isAdmin && (
              <Link to="/admin" className="hidden lg:block">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <div className="search-bar">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
