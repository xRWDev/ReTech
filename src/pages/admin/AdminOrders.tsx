import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/types';
import type { OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

const statusColors = {
  NEW: 'status-new',
  PAID: 'status-paid',
  SHIPPED: 'status-shipped',
  DONE: 'status-done',
  CANCELLED: 'status-cancelled',
};

const statusFlow: OrderStatus[] = ['NEW', 'PAID', 'SHIPPED', 'DONE'];

export default function AdminOrders() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: orders, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const filteredOrders = orders?.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast({ title: 'Success', description: `Order status updated to ${ORDER_STATUS_LABELS[newStatus]}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm">{orders?.length || 0} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(status => (
              <SelectItem key={status} value={status}>{ORDER_STATUS_LABELS[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Items</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Delivery</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-4" colSpan={7}>
                      <div className="h-12 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.name}</p>
                        <p className="text-sm text-muted-foreground">{order.phone}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-4 text-sm">{order.items?.length || 0} items</td>
                    <td className="p-4 font-medium">{formatPrice(Number(order.total))}</td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {order.delivery_type === 'COURIER' ? 'Courier' : 'Pickup'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('status-badge', statusColors[order.status])}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusFlow.map(status => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(order.id, status)}
                              disabled={order.status === status}
                            >
                              <span className={cn('status-badge mr-2', statusColors[status])}>
                                {ORDER_STATUS_LABELS[status]}
                              </span>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                            disabled={order.status === 'CANCELLED'}
                            className="text-destructive"
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
