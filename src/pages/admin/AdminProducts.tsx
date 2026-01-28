import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useAuth } from '@/lib/auth';
import { formatPrice, generateSlug, cn } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import type { Product, ProductCategory, ProductCondition } from '@/types';
import { toast } from '@/hooks/use-toast';

const emptyProduct = {
  title: '',
  slug: '',
  category: 'smartphones' as ProductCategory,
  brand: '',
  model: '',
  price: 0,
  old_price: null as number | null,
  currency: 'UAH',
  condition: 'B' as ProductCondition,
  storage: '',
  ram: '',
  cpu: '',
  gpu: '',
  screen_size: '',
  battery_health: null as number | null,
  color: '',
  location_city: 'Kyiv',
  warranty_months: 0,
  description: '',
  images: [] as string[],
  is_available: true,
  stock_count: 1,
  rating_avg: null as number | null,
  rating_count: 0,
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: products, isLoading } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [imageUrls, setImageUrls] = useState('');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const filteredProducts = products
    ?.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.model?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const isAvailable = p.is_available && p.stock_count > 0;
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && isAvailable) ||
        (availabilityFilter === 'unavailable' && !isAvailable);
      return matchesSearch && matchesCategory && matchesAvailability;
    })
    ?.slice()
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'stock_asc':
          return a.stock_count - b.stock_count;
        case 'stock_desc':
          return b.stock_count - a.stock_count;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImageUrls('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...emptyProduct,
      ...product,
    });
    setImageUrls(product.images.join('\n'));
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.brand || !formData.price) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const images = imageUrls.split('\n').filter(url => url.trim());
    const productData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      images,
      old_price: formData.old_price || null,
      battery_health: formData.battery_health || null,
    };

    try {
      if (editingProduct?.id) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await createProduct.mutateAsync(productData as any);
        toast({ title: 'Success', description: 'Product created' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingProductId) return;
    
    try {
      await deleteProduct.mutateAsync(deletingProductId);
      toast({ title: 'Success', description: 'Product deleted' });
      setIsDeleteDialogOpen(false);
      setDeletingProductId(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const toggleAvailability = async (product: Product) => {
    await updateProduct.mutateAsync({
      id: product.id,
      is_available: !product.is_available,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{products?.length || 0} products</p>
        </div>
        <Button className="btn-primary-gradient" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
            <SelectItem value="stock_desc">Stock: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Available</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-4" colSpan={6}>
                      <div className="h-12 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                          <img
                            src={product.images[0] || '/placeholder.svg'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.title}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{CATEGORY_LABELS[product.category]}</Badge>
                    </td>
                    <td className="p-4 font-medium">{formatPrice(product.price)}</td>
                    <td className="p-4">
                      <span className={cn(
                        product.stock_count === 0 && 'text-destructive',
                        product.stock_count <= 3 && product.stock_count > 0 && 'text-warning'
                      )}>
                        {product.stock_count}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={product.is_available}
                        onCheckedChange={() => toggleAvailability(product)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setDeletingProductId(product.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="iPhone 14 Pro Max"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Apple"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as ProductCategory })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData({ ...formData, condition: v as ProductCondition })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map(cond => (
                      <SelectItem key={cond} value={cond}>{CONDITION_LABELS[cond].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="old_price">Old Price</Label>
                <Input
                  id="old_price"
                  type="number"
                  value={formData.old_price || ''}
                  onChange={(e) => setFormData({ ...formData, old_price: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <Label htmlFor="stock_count">Stock</Label>
                <Input
                  id="stock_count"
                  type="number"
                  value={formData.stock_count}
                  onChange={(e) => setFormData({ ...formData, stock_count: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="storage">Storage</Label>
                <Input
                  id="storage"
                  value={formData.storage || ''}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  placeholder="256GB"
                />
              </div>
              <div>
                <Label htmlFor="ram">RAM</Label>
                <Input
                  id="ram"
                  value={formData.ram || ''}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  placeholder="8GB"
                />
              </div>
              <div>
                <Label htmlFor="warranty_months">Warranty (months)</Label>
                <Input
                  id="warranty_months"
                  type="number"
                  value={formData.warranty_months}
                  onChange={(e) => setFormData({ ...formData, warranty_months: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  value={formData.location_city}
                  onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
              />
            </div>

            <div>
              <Label htmlFor="images">Image URLs (one per line)</Label>
              <Textarea
                id="images"
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              className="btn-primary-gradient"
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
