import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import PriceDisplay from './PriceDisplay';
import Badge from '../ui/Badge';
import QuickViewModal from './QuickViewModal';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useSettingsStore } from '../../store/settingsStore';
import CallRequestModal from './CallRequestModal';
import toast from 'react-hot-toast';

export default function ProductCard({ product, onWishlistChange }) {
  const [adding, setAdding] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [callRequestOpen, setCallRequestOpen] = useState(false);
  const callRequestMode = useSettingsStore((s) => s.callRequestMode);
  const addItem = useCartStore((s) => s.addItem);
  const customer = useAuthStore((s) => s.customer);
  const wishListed = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const wishlistAdd = useWishlistStore((s) => s.add);
  const wishlistRemove = useWishlistStore((s) => s.remove);

  const image = product.images?.[0];
  const hasDiscount = product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;
  const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
  const isLowStock = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(product.id);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    try {
      if (wishListed) {
        await wishlistRemove(product.id);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAdd(product.id);
        toast.success('Added to wishlist');
      }
      onWishlistChange?.();
    } catch {
      toast.error('Wishlist error');
    }
  };

  return (
    <div className="group flex flex-col">
      <Link to={`/product/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-square bg-surface rounded-lg overflow-hidden mb-3">
          {image ? (
            <img
              src={image.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <ShoppingBag size={32} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="error" size="sm">-{discountPercent}%</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="neutral" size="sm">Sold Out</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning" size="sm">Low Stock</Badge>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={clsx(
              'absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-all',
              'hover:bg-white hover:shadow-md',
              wishListed && 'text-error'
            )}
          >
            <Heart size={16} className={wishListed ? 'fill-current' : ''} />
          </button>

          {/* Quick view */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white text-primary-900 text-xs font-medium px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-primary-50"
          >
            <Eye size={14} />
            Quick View
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-primary-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <PriceDisplay
            price={product.price}
            salePrice={product.sale_price}
            size="sm"
          />
        </div>
      </Link>

      {/* Add to cart / Call request */}
      {callRequestMode ? (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCallRequestOpen(true); }}
          className="mt-3 w-full h-9 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-all bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
        >
          <PhoneCall size={15} />
          Request a Call
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={clsx(
            'mt-3 w-full h-9 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-all',
            isOutOfStock
              ? 'bg-primary-100 text-muted cursor-not-allowed'
              : 'bg-primary-900 text-white hover:bg-primary-700 active:bg-primary-800'
          )}
        >
          {adding ? (
            <span className="animate-pulse">Adding...</span>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingBag size={15} />
              Add to Cart
            </>
          )}
        </button>
      )}

      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />

      <CallRequestModal
        product={product}
        isOpen={callRequestOpen}
        onClose={() => setCallRequestOpen(false)}
      />
    </div>
  );
}
