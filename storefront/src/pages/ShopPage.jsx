import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ecommerce/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Breadcrumb from '../components/ui/Breadcrumb';
import EmptyState from '../components/ecommerce/EmptyState';
import { Search, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { t } = useTranslation();

  const SORT_OPTIONS = [
    { value: 'created_at:desc', label: t('shop.newestFirst') },
    { value: 'created_at:asc', label: t('shop.oldestFirst') },
    { value: 'price:asc', label: t('shop.priceLowHigh') },
    { value: 'price:desc', label: t('shop.priceHighLow') },
    { value: 'name:asc', label: t('shop.nameAZ') },
    { value: 'name:desc', label: t('shop.nameZA') },
  ];

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('categoryId') || '';
  const currentOnSale = searchParams.get('onSale') || '';
  const currentSort = searchParams.get('sort') || 'created_at:desc';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    api.get('/products/categories').then((res) => {
      const flatCategories = flattenCategories(res.data.data || []);
      setCategories(flatCategories);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentSearch, currentCategory, currentOnSale, currentSort, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = currentSort.split(':');
      const params = {
        page: currentPage,
        limit: 12,
        status: 'published',
        sortBy,
        sortOrder,
      };
      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.categoryId = currentCategory;
      if (currentOnSale) params.onSale = currentOnSale;

      const { data } = await api.get('/products', { params });
      setProducts(data.data || []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = currentSearch || currentCategory || currentOnSale;
  const selectedCategory = categories.find((c) => c.id === currentCategory);

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop' },
          ...(selectedCategory ? [{ label: selectedCategory.name }] : []),
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-8 pb-16">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <h2 className="text-sm font-semibold text-primary-900 uppercase tracking-wider mb-4">{t('shop.filters')}</h2>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder={t('shop.search')}
              value={currentSearch}
              onChange={(e) => updateParam('search', e.target.value)}
              prefix={<Search size={16} />}
              size="sm"
            />
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-primary-700 mb-2">{t('shop.categories')}</h3>
            <div className="space-y-1">
              <button
                onClick={() => updateParam('categoryId', '')}
                className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                  !currentCategory ? 'bg-primary-100 text-primary-900 font-medium' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                }`}
              >
                {t('shop.allProducts')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('categoryId', cat.id)}
                  className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                    currentCategory === cat.id ? 'bg-primary-100 text-primary-900 font-medium' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  {cat.depth > 0 && <span className="mr-2">{'—'.repeat(cat.depth)}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted hover:text-primary-900 flex items-center gap-1"
            >
              <X size={14} /> {t('shop.clearFilters')}
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-primary-900">
                {currentOnSale ? t('shop.sale') : selectedCategory ? selectedCategory.name : t('shop.allProducts')}
              </h1>
              {!loading && (
                <span className="text-sm text-muted">({pagination.total})</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden p-2 border border-border rounded-md text-primary-600 hover:text-primary-900"
              >
                <SlidersHorizontal size={18} />
              </button>
              <Select
                options={SORT_OPTIONS}
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-44"
              />
            </div>
          </div>

          {/* Mobile filters */}
          {filtersOpen && (
            <div className="lg:hidden mb-6 p-4 bg-surface rounded-lg space-y-4">
              <Input
                placeholder={t('shop.search')}
                value={currentSearch}
                onChange={(e) => updateParam('search', e.target.value)}
                prefix={<Search size={16} />}
                size="sm"
              />
              <Select
                label="Category"
                options={[
                  { value: '', label: t('shop.allProducts') },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={currentCategory}
                onChange={(e) => updateParam('categoryId', e.target.value)}
              />
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-muted hover:text-primary-900 flex items-center gap-1">
                  <X size={14} /> {t('shop.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                  Search: {currentSearch}
                  <button onClick={() => updateParam('search', '')}><X size={12} /></button>
                </span>
              )}
              {currentOnSale && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md">
                  {t('shop.onSale')}
                  <button onClick={() => updateParam('onSale', '')}><X size={12} /></button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                  {selectedCategory.name}
                  <button onClick={() => updateParam('categoryId', '')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title={t('shop.noProducts')}
              description={t('shop.noProductsHint')}
              action={hasActiveFilters ? { label: t('shop.clearFilters'), onClick: clearFilters } : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={(page) => updateParam('page', String(page))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function flattenCategories(categories, depth = 0) {
  const result = [];
  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}
