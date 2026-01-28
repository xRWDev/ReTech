import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard';
import { useProducts, useFilterOptions } from '@/hooks/useProducts';
import { useFilterStore, useUIStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import type { ProductCategory, ProductCondition } from '@/types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';

const warrantyOptions = [
  { value: null, label: 'Any' },
  { value: 1, label: '1+ months' },
  { value: 3, label: '3+ months' },
  { value: 6, label: '6+ months' },
];

export default function CatalogPage() {
  const { filters, setFilter, toggleCategory, toggleBrand, toggleCondition, toggleCity, resetFilters } = useFilterStore();
  const { isFiltersOpen, setFiltersOpen } = useUIStore();
  const { data: products, isLoading } = useProducts(filters);
  const { data: filterOptions } = useFilterOptions();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const categoryParam = searchParams.get('category') as ProductCategory | null;

  useEffect(() => {
    if (categoryParam && CATEGORY_LABELS[categoryParam]) {
      setFilter('categories', [categoryParam]);
    }
  }, [categoryParam, setFilter]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (!filterOptions) return;
    if (filters.priceRange[0] === 0 && filters.priceRange[1] === 100000) {
      setFilter('priceRange', [filterOptions.minPrice, filterOptions.maxPrice]);
    }
  }, [filterOptions, filters.priceRange, setFilter]);

  const activeFilterCount = 
    filters.categories.length + 
    filters.brands.length + 
    filters.conditions.length + 
    filters.cities.length +
    (filters.warrantyMonths !== null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.categories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              <span className="text-sm">{CATEGORY_LABELS[cat]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      {filterOptions && (
        <div>
          <h4 className="font-medium mb-3">Price Range</h4>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilter('priceRange', value as [number, number])}
            min={filterOptions.minPrice}
            max={filterOptions.maxPrice}
            step={1000}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(filters.priceRange[0])}</span>
            <span>{formatPrice(filters.priceRange[1])}</span>
          </div>
        </div>
      )}

      {/* Condition */}
      <div>
        <h4 className="font-medium mb-3">Condition</h4>
        <div className="space-y-2">
          {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map((cond) => (
            <label key={cond} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.conditions.includes(cond)}
                onCheckedChange={() => toggleCondition(cond)}
              />
              <span className="text-sm">{CONDITION_LABELS[cond].label}</span>
              <span className="text-xs text-muted-foreground">
                ({CONDITION_LABELS[cond].description})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      {filterOptions && filterOptions.brands.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Brand</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <span className="text-sm">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* City */}
      {filterOptions && filterOptions.cities.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Location</h4>
          <div className="space-y-2">
            {filterOptions.cities.map((city) => (
              <label key={city} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.cities.includes(city)}
                  onCheckedChange={() => toggleCity(city)}
                />
                <span className="text-sm">{city}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Warranty */}
      <div>
        <h4 className="font-medium mb-3">Warranty</h4>
        <Select
          value={filters.warrantyMonths?.toString() ?? 'any'}
          onValueChange={(v) => setFilter('warrantyMonths', v === 'any' ? null : parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any warranty" />
          </SelectTrigger>
          <SelectContent>
            {warrantyOptions.map((opt) => (
              <SelectItem key={opt.label} value={opt.value?.toString() ?? 'any'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* In Stock Only */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={filters.inStockOnly}
          onCheckedChange={(checked) => setFilter('inStockOnly', !!checked)}
        />
        <span className="text-sm font-medium">In stock only</span>
      </label>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={resetFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const totalPages = products ? Math.ceil(products.length / pageSize) : 0;
  const pagedProducts = products
    ? products.slice((page - 1) * pageSize, page * pageSize)
    : [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catalog</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading...' : `${products?.length ?? 0} products`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sort */}
          <Select
            value={filters.sortBy}
            onValueChange={(v) => setFilter('sortBy', v as any)}
          >
            <SelectTrigger className="w-32 sm:w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter button - mobile */}
          <Sheet open={isFiltersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="w-full rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-220px)] pr-4 mt-4">
                <FilterContent />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="filter-chip cursor-pointer" onClick={() => toggleCategory(cat)}>
              {CATEGORY_LABELS[cat]}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filters.brands.map((brand) => (
            <Badge key={brand} variant="secondary" className="filter-chip cursor-pointer" onClick={() => toggleBrand(brand)}>
              {brand}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filters.conditions.map((cond) => (
            <Badge key={cond} variant="secondary" className="filter-chip cursor-pointer" onClick={() => toggleCondition(cond)}>
              {CONDITION_LABELS[cond].label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filters.cities.map((city) => (
            <Badge key={city} variant="secondary" className="filter-chip cursor-pointer" onClick={() => toggleCity(city)}>
              {city}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filters.warrantyMonths !== null && (
            <Badge variant="secondary" className="filter-chip cursor-pointer" onClick={() => setFilter('warrantyMonths', null)}>
              {filters.warrantyMonths}+ mo warranty
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filters.inStockOnly && (
            <Badge variant="secondary" className="filter-chip cursor-pointer" onClick={() => setFilter('inStockOnly', false)}>
              In stock
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
            Clear all
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="glass-card rounded-2xl p-4 sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {/* Category chips - mobile */}
          <div className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
                const isActive = filters.categories.includes(cat);
                return (
                  <Button
                    key={cat}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap rounded-full"
                    onClick={() => toggleCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {pagedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
