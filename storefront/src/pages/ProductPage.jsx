import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Truck, Shield, Package, PhoneCall } from 'lucide-react';
import ProductGallery from '../components/ecommerce/ProductGallery';
import PriceDisplay from '../components/ecommerce/PriceDisplay';
import SaleCountdown from '../components/ecommerce/SaleCountdown';
import QuantitySelector from '../components/ecommerce/QuantitySelector';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Breadcrumb from '../components/ui/Breadcrumb';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import ProductCard from '../components/ecommerce/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { isSaleActive } from '../utils/sale';
import { useSettingsStore } from '../store/settingsStore';
import CallRequestModal from '../components/ecommerce/CallRequestModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adding, setAdding] = useState(false);
  const [callRequestOpen, setCallRequestOpen] = useState(false);
  const callRequestMode = useSettingsStore((s) => s.callRequestMode);
  const wishlistAdd = useWishlistStore((s) => s.add);
  const wishlistRemove = useWishlistStore((s) => s.remove);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product?.id));
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const customer = useAuthStore((s) => s.customer);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setSelectedVariant(null);

    api.get(`/products/slug/${slug}`)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);

        setRelatedLoading(true);
        api.get(`/products/${p.id}/related`, { params: { limit: 4 } })
          .then((r) => {
            setRelatedProducts(r.data.data || []);
          })
          .catch(() => setRelatedProducts([]))
          .finally(() => setRelatedLoading(false));
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6 py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-primary-900 mb-2">{t('product.notFound')}</h1>
        <p className="text-muted mb-6">{t('product.notFoundDesc')}</p>
        <Link to="/shop" className="text-sm text-primary-900 font-medium hover:underline">
          {t('product.backToShop')}
        </Link>
      </div>
    );
  }

  const saleActive = isSaleActive(product);
  const activePrice = selectedVariant
    ? { price: selectedVariant.price, salePrice: selectedVariant.sale_price }
    : { price: product.price, salePrice: saleActive ? product.sale_price : null };

  const activeStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;

  const isOutOfStock = product.track_inventory && activeStock <= 0;
  const isLowStock = product.track_inventory && activeStock > 0 && activeStock <= (product.low_stock_threshold || 5);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(product.id, selectedVariant?.id || null, quantity);
      toast.success(t('product.addedToCart'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!customer) {
      toast.error(t('product.signInForWishlist'));
      return;
    }
    try {
      if (wishlisted) {
        await wishlistRemove(product.id);
        toast.success(t('product.removedFromWishlist'));
      } else {
        await wishlistAdd(product.id);
        toast.success(t('product.addedToWishlist'));
      }
    } catch {
      toast.error(t('product.wishlistError'));
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          ...(product.categories?.[0] ? [{ label: product.categories[0].name, href: `/shop?categoryId=${product.categories[0].id}` }] : []),
          { label: product.name },
        ]}
      />

      {/* ─── Hero: Gallery + Info ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 pb-10">
        {/* Gallery - LEFT */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images || []} />
        </div>

        {/* Info - RIGHT */}
        <div className="flex flex-col">
          {/* Category */}
          {product.categories?.[0] && (
            <Link
              to={`/shop?categoryId=${product.categories[0].id}`}
              className="text-xs text-muted uppercase tracking-widest hover:text-primary-900 transition-colors mb-3"
            >
              {product.categories[0].name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-2xl lg:text-[28px] font-bold text-primary-900 leading-tight tracking-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-5">
            <PriceDisplay
              price={activePrice.price}
              salePrice={activePrice.salePrice}
              size="lg"
            />
            {saleActive && product.sale_end_date && (
              <SaleCountdown endDate={product.sale_end_date} size="md" className="mt-2" />
            )}
          </div>

          {/* Stock */}
          <div className="mt-3">
            {isOutOfStock ? (
              <Badge variant="error" dot>{t('product.outOfStock')}</Badge>
            ) : isLowStock ? (
              <Badge variant="warning" dot>{t('product.onlyLeft', { count: activeStock })}</Badge>
            ) : (
              <Badge variant="success" dot>{t('product.inStock')}</Badge>
            )}
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted mt-2">{t('product.sku', { value: product.sku })}</p>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mt-6">
              <span className="text-sm font-medium text-primary-900">{t('product.options')}</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.variants.filter((v) => v.is_active).map((variant) => {
                  const isSelf = !variant.url;
                  const isActive = isSelf
                    ? !selectedVariant
                    : selectedVariant?.id === variant.id;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        if (variant.url) {
                          navigate(variant.url);
                        } else {
                          setSelectedVariant(selectedVariant?.id === variant.id ? null : variant);
                        }
                      }}
                      className={clsx(
                        'px-4 py-2 text-sm border rounded-md transition-all',
                        isActive
                          ? 'border-primary-900 bg-primary-900 text-white'
                          : 'border-primary-300 text-primary-700 hover:border-primary-900'
                      )}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description inline */}
          {product.description && (
            <div className="mt-6">
              <span className="text-sm font-medium text-primary-900">{t('product.description')}</span>
              <p className="mt-1.5 text-sm text-primary-500 leading-relaxed line-clamp-4">
                {product.description}
              </p>
            </div>
          )}

          {/* Add to Cart row */}
          <div className="mt-8 flex items-center gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={product.track_inventory ? activeStock : 99}
              disabled={isOutOfStock}
            />
            <button
              onClick={handleWishlist}
              className={clsx(
                'flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all',
                wishlisted
                  ? 'border-error/30 bg-error/5 text-error'
                  : 'border-primary-200 text-primary-400 hover:border-primary-900 hover:text-primary-900'
              )}
              title={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            >
              <Heart size={18} className={wishlisted ? 'fill-current' : ''} />
            </button>
          </div>

          {callRequestMode ? (
            <button
              onClick={() => setCallRequestOpen(true)}
              className="mt-4 w-full py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 active:scale-[0.99]"
            >
              <PhoneCall size={18} />
              {t('product.requestCall')}
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className={clsx(
                'mt-4 w-full py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2',
                isOutOfStock
                  ? 'bg-primary-200 text-primary-400 cursor-not-allowed'
                  : 'bg-primary-900 text-white hover:bg-primary-800 active:scale-[0.99]'
              )}
            >
              {adding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={18} />
                  {isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
                </>
              )}
            </button>
          )}

          {/* Trust badges - card style */}
          <div className="mt-6 rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Truck size={20} className="text-primary-900 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-900">{t('product.freeShipping')}</p>
                <p className="text-xs text-muted">{t('product.freeShippingDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Shield size={20} className="text-primary-900 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-900">{t('product.warranty')}</p>
                <p className="text-xs text-muted">{t('product.warrantyDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Specifications (Attributes) ─── */}
      {product.attributes?.length > 0 && (
        <div className="border-t border-border py-12">
          <h2 className="text-lg font-bold text-primary-900 mb-6">{t('product.specifications')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex flex-col items-center text-center rounded-xl border border-border py-5 px-3"
              >
                <Package size={22} className="text-primary-400 mb-2" />
                <span className="text-sm font-semibold text-primary-900">{attr.key}</span>
                <span className="text-xs text-muted mt-0.5">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Related Products ─── */}
      {(relatedLoading || relatedProducts.length > 0) && (
        <div className="border-t border-border py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-primary-900">{t('product.youMayAlsoLike')}</h2>
            <Link to="/shop" className="text-sm text-muted hover:text-primary-900 transition-colors">
              {t('product.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedLoading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
      <CallRequestModal
        product={product}
        isOpen={callRequestOpen}
        onClose={() => setCallRequestOpen(false)}
      />
    </div>
  );
}
