import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  DollarSign,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis } from 'recharts';
import { subDays, format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: products } = useAdminProducts();
  const { data: orders } = useAdminOrders();

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const totalProducts = products?.length || 0;
  const inStock = products?.filter(p => p.is_available && p.stock_count > 0).length || 0;
  const todayOrders = orders?.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  }).length || 0;
  const totalRevenue = orders
    ?.filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total), 0) || 0;

  const ordersByDay = Array.from({ length: 14 }, (_, index) => {
    const date = subDays(new Date(), 13 - index);
    const count = orders?.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.toDateString() === date.toDateString();
    }).length || 0;

    return {
      date: format(date, 'MMM d'),
      orders: count,
    };
  });

  const chartConfig = {
    orders: {
      label: 'Orders',
      color: 'hsl(var(--primary))',
    },
  };

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-primary' },
    { label: 'In Stock', value: inStock, icon: LayoutGrid, color: 'text-success' },
    { label: 'Orders Today', value: todayOrders, icon: ShoppingBag, color: 'text-accent' },
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-warning' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your store</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/products')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove products</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/orders')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Orders</h3>
                  <p className="text-sm text-muted-foreground">View and update order status</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Orders Chart */}
      <div className="mt-8">
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Orders (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={ordersByDay} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="orders"
                  type="monotone"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {orders && orders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">View All</Link>
            </Button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="p-4 text-sm">#{order.id.slice(0, 8)}</td>
                    <td className="p-4 text-sm">{order.name}</td>
                    <td className="p-4">
                      <span className={`status-badge ${
                        order.status === 'NEW' ? 'status-new' :
                        order.status === 'PAID' ? 'status-paid' :
                        order.status === 'SHIPPED' ? 'status-shipped' :
                        order.status === 'DONE' ? 'status-done' :
                        'status-cancelled'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right font-medium">{formatPrice(Number(order.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
