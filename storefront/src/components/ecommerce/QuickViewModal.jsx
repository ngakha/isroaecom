import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, ArrowRight, PhoneCall } from 'lucide-react';
import Modal from '../ui/Modal';
import PriceDisplay from './PriceDisplay';
import QuantitySelector from './QuantitySelector';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useSettingsStore } from '../../store/settingsStore';
import CallRequestModal from './CallRequestModal';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [callRequestOpen, setCallRequestOpen] = useState(false);
  const callRequestMode = useSettingsStore((s) => s.callRequestMode);
  const addItem = useCartStore((s) => s.addItem);
  const customer = useAuthStore((s) => s.customer);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product?.id));
  const wishlistAdd = useWishlistStore((s) => s.add);
  const wishlistRemove = useWishlistStore((s) => s.remove);

  if (!product) return null;

  const image = product.images?.[0];
  const hasDiscount = product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;
  const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
  const isLowStock = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(product.id, null, quantity);
      toast.success('Added to cart');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!customer) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    try {
      if (wishlisted) {
        await wishlistRemove(product.id);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAdd(product.id);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Wishlist error');
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative aspect-square bg-surface rounded-lg overflow-hidden">
          {image ? (
            <img
              src={image.url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <ShoppingBag size={48} />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="error" size="sm">-{discountPercent}%</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="neutral" size="sm">Sold Out</Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.categories?.[0] && (
            <span className="text-xs text-muted uppercase tracking-wider mb-1">
              {product.categories[0].name}
            </span>
          )}

          <h2 className="text-xl font-semibold text-primary-900 tracking-tight">
            {product.name}
          </h2>

          {product.sku && (
            <p className="text-xs text-muted mt-1">SKU: {product.sku}</p>
          )}

          <div className="mt-3">
            <PriceDisplay
              price={product.price}
              salePrice={product.sale_price}
              size="lg"
            />
          </div>

          {/* Stock */}
          <div className="mt-3">
            {isOutOfStock ? (
              <Badge variant="error" dot>Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="warning" dot>Only {product.stock_quantity} left</Badge>
            ) : (
              <Badge variant="success" dot>In Stock</Badge>
            )}
          </div>

          {/* Quantity & Add to Cart / Call Request */}
          <div className="mt-5 flex items-center gap-3">
            {callRequestMode ? (
              <button
                onClick={() => { onClose(); setCallRequestOpen(true); }}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall size={16} />
                Request a Call
              </button>
            ) : (
              <>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={product.track_inventory ? product.stock_quantity : 99}
                  disabled={isOutOfStock}
                />
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={<ShoppingBag size={16} />}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  loading={adding}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={clsx(
              'mt-3 flex items-center gap-1.5 text-sm transition-colors',
              wishlisted ? 'text-error' : 'text-muted hover:text-primary-900'
            )}
          >
            <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
            {wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
          </button>

          {/* View Full Details */}
          <Link
            to={`/product/${product.slug}`}
            onClick={onClose}
            className="mt-auto pt-4 flex items-center gap-1.5 text-sm font-medium text-primary-900 hover:text-primary-600 transition-colors"
          >
            View Full Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>

    {callRequestOpen && (
      <CallRequestModal
        product={product}
        isOpen={callRequestOpen}
        onClose={() => setCallRequestOpen(false)}
      />
    )}
    </>
  );
}
