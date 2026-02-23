import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag, X, Trash2 } from 'lucide-react';
import CartItem from '../components/ecommerce/CartItem';
import PriceDisplay from '../components/ecommerce/PriceDisplay';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ecommerce/EmptyState';
import Breadcrumb from '../components/ui/Breadcrumb';
import Skeleton from '../components/ui/Skeleton';
import { useCartStore } from '../store/cartStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/discounts/apply', {
        code: couponCode.trim(),
        subtotal,
      });
      setAppliedCoupon(data.data);
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleClearCart = async () => {
    await clearCart();
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cart cleared');
  };

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title="Your cart is empty"
          description="Looks like you haven't added any items yet."
          action={{ label: 'Start Shopping', onClick: () => navigate('/shop') }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-16">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-primary-900">
              Shopping Cart ({items.length})
            </h1>
            <button
              onClick={handleClearCart}
              className="text-sm text-muted hover:text-error flex items-center gap-1 transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 py-4">
                  <Skeleton className="w-20 h-20 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-surface rounded-lg p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-primary-600">Subtotal</span>
                <span className="text-primary-900 font-medium">{subtotal.toFixed(2)} GEL</span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    {appliedCoupon.discount.code}
                    <button onClick={removeCoupon} className="text-muted hover:text-error ml-1">
                      <X size={12} />
                    </button>
                  </span>
                  <span>-{discountAmount.toFixed(2)} GEL</span>
                </div>
              )}

              <div className="flex items-center justify-between text-primary-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <hr className="border-border" />

              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-primary-900">Total</span>
                <span className="font-semibold text-primary-900">{total.toFixed(2)} GEL</span>
              </div>
            </div>

            {/* Coupon */}
            {!appliedCoupon && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <div className="mt-6">
              <Button
                fullWidth
                size="lg"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
                onClick={() => navigate('/checkout', { state: { coupon: appliedCoupon } })}
              >
                Proceed to Checkout
              </Button>
            </div>

            <Link
              to="/shop"
              className="block text-center text-sm text-muted hover:text-primary-900 mt-4 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
