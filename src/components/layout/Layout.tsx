import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useAuth } from '@/lib/auth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      {/* Header - visible on all screens */}
      <Header />

      <div className="flex w-full">
        {/* Sidebar - desktop only */}
        <Sidebar className="hidden lg:flex" />

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-64px)] pb-20 lg:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom navigation - mobile only */}
      <BottomNav className="lg:hidden" />

      {/* Cart drawer */}
      <CartDrawer />
    </div>
  );
}
