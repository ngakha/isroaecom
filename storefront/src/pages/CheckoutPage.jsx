import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AddressForm from '../components/ecommerce/AddressForm';
import AddressCard from '../components/ecommerce/AddressCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const customer = useAuthStore((s) => s.customer);
  const { t } = useTranslation();

  const STEPS = [
    { id: 'info', label: t('checkout.information') },
    { id: 'shipping', label: t('checkout.shipping') },
    { id: 'payment', label: t('checkout.payment') },
  ];

  const couponFromCart = location.state?.coupon;

  const [step, setStep] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  // Customer info
  const [info, setInfo] = useState({
    email: customer?.email || '',
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
  });

  // Shipping address
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(null);

  // Shipping rates
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Payment
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCart();
    api.get('/payments/methods').then((res) => {
      setPaymentMethods(res.data.data || []);
    }).catch(() => {});

    if (customer) {
      api.get('/customers/me/addresses').then((res) => {
        const addresses = res.data.data || [];
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          setShippingAddress(defaultAddr);
        } else {
          setShowNewAddress(true);
        }
      }).catch(() => setShowNewAddress(true));
    } else {
      setShowNewAddress(true);
    }
  }, []);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discountAmount = couponFromCart?.discountAmount || 0;
  const shippingAmount = selectedRate ? parseFloat(selectedRate.price) || 0 : 0;
  const total = subtotal - discountAmount + shippingAmount;

  // Fetch shipping rates when address is set
  const fetchShippingRates = async (address) => {
    setRatesLoading(true);
    try {
      const { data } = await api.post('/shipping/rates', {
        items: items.map((item) => ({
          weight: item.weight || 0,
          quantity: item.quantity,
        })),
        shippingAddress: { country: address.country || 'Georgia' },
        subtotal,
      });
      const rates = data.data || [];
      setShippingRates(rates);
      if (rates.length > 0) {
        setSelectedRate(rates[0]);
      }
    } catch {
      setShippingRates([]);
    } finally {
      setRatesLoading(false);
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setShippingAddress(address);
    setShowNewAddress(false);
  };

  const handleNewAddress = (formData) => {
    const address = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      address_line1: formData.addressLine1,
      address_line2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postalCode,
      country: formData.country,
      phone: formData.phone,
    };
    setShippingAddress(address);
    setSelectedAddress(null);
    setShowNewAddress(false);
  };

  const goToStep = (newStep) => {
    if (newStep === 'shipping' && !shippingAddress) {
      toast.error(t('checkout.enterShippingAddress'));
      return;
    }
    if (newStep === 'shipping') {
      fetchShippingRates(shippingAddress);
    }
    if (newStep === 'payment' && !selectedRate) {
      toast.error(t('checkout.selectShippingMethod'));
      return;
    }
    setStep(newStep);
  };

  const handlePlaceOrder = async () => {
    if (!info.email || !info.firstName || !info.lastName) {
      toast.error(t('checkout.fillContactInfo'));
      setStep('info');
      return;
    }
    if (!shippingAddress) {
      toast.error(t('checkout.enterShippingAddress'));
      setStep('info');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customerId: customer?.id,
        customerEmail: info.email,
        customerName: `${info.firstName} ${info.lastName}`,
        items: items.map((item) => ({
          productId: item.product_id,
          variantId: item.variant_id || undefined,
          name: item.name,
          sku: item.sku || undefined,
          price: item.variant_id
            ? (item.variant_price || item.product_price)
            : (item.sale_price || item.product_price),
          quantity: item.quantity,
        })),
        shippingAddress: {
          first_name: shippingAddress.first_name || shippingAddress.firstName || info.firstName,
          last_name: shippingAddress.last_name || shippingAddress.lastName || info.lastName,
          address_line1: shippingAddress.address_line1 || shippingAddress.addressLine1,
          address_line2: shippingAddress.address_line2 || shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state || '',
          postal_code: shippingAddress.postal_code || shippingAddress.postalCode || '',
          country: shippingAddress.country || 'Georgia',
          phone: shippingAddress.phone || '',
        },
        paymentMethod: selectedPayment,
        couponCode: couponFromCart?.discount?.code,
        shippingAmount,
        discountAmount,
        currency: 'GEL',
        notes: notes || undefined,
      };

      const { data } = await api.post('/orders', orderData);
      const order = data.data;

      // Process payment
      if (selectedPayment && selectedPayment !== 'cash_on_delivery') {
        try {
          const payResult = await api.post('/payments/checkout', {
            orderId: order.id,
            provider: selectedPayment,
          });
          if (payResult.data.data?.paymentUrl) {
            window.location.href = payResult.data.data.paymentUrl;
            return;
          }
        } catch {
          // Payment initiation failed, order still created
        }
      } else if (selectedPayment === 'cash_on_delivery') {
        try {
          await api.post('/payments/checkout', {
            orderId: order.id,
            provider: 'cash_on_delivery',
          });
        } catch {
          // COD confirmation failed, order still created
        }
      }

      await clearCart();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !submitting) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-primary-900 mb-2">{t('checkout.emptyCart')}</h1>
        <Link to="/shop" className="text-sm text-primary-900 font-medium hover:underline">
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Cart', href: '/cart' },
        { label: 'Checkout' },
      ]} />

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (STEPS.findIndex((st) => st.id === s.id) <= STEPS.findIndex((st) => st.id === step)) {
                  setStep(s.id);
                }
              }}
              className={clsx(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                step === s.id ? 'text-primary-900' : 'text-muted'
              )}
            >
              <span className={clsx(
                'w-6 h-6 flex items-center justify-center rounded-full text-xs',
                step === s.id ? 'bg-primary-900 text-white' : 'bg-primary-100 text-muted'
              )}>
                {STEPS.findIndex((st) => st.id === step) > i ? <Check size={14} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={16} className="text-primary-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-16">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Info */}
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('checkout.contactInfo')}</h2>
                {!customer && (
                  <p className="text-sm text-muted mb-4">
                    {t('checkout.alreadyHaveAccount')}{' '}
                    <Link to="/login" state={{ from: '/checkout' }} className="text-primary-900 font-medium hover:underline">
                      {t('checkout.signIn')}
                    </Link>
                  </p>
                )}
                <div className="space-y-4">
                  <Input
                    label={t('checkout.email')}
                    type="email"
                    value={info.email}
                    onChange={(e) => setInfo((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t('checkout.firstName')}
                      value={info.firstName}
                      onChange={(e) => setInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                    <Input
                      label={t('checkout.lastName')}
                      value={info.lastName}
                      onChange={(e) => setInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('checkout.shippingAddress')}</h2>
                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {savedAddresses.map((addr) => (
                      <AddressCard
                        key={addr.id}
                        address={addr}
                        selected={selectedAddress?.id === addr.id}
                        onSelect={handleAddressSelect}
                        selectable
                      />
                    ))}
                    <button
                      onClick={() => setShowNewAddress(!showNewAddress)}
                      className="text-sm text-primary-900 font-medium hover:underline"
                    >
                      {showNewAddress ? t('checkout.cancel') : t('checkout.addNewAddress')}
                    </button>
                  </div>
                )}
                {(showNewAddress || savedAddresses.length === 0) && (
                  <AddressForm onSubmit={handleNewAddress} />
                )}
              </div>

              <Button
                size="lg"
                onClick={() => goToStep('shipping')}
                icon={<ChevronRight size={18} />}
                iconPosition="right"
              >
                {t('checkout.continueToShipping')}
              </Button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 'shipping' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('checkout.shippingMethod')}</h2>

              {ratesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-primary-100 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-primary-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : shippingRates.length === 0 ? (
                <p className="text-sm text-muted">{t('checkout.noShippingMethods')}</p>
              ) : (
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRate(rate)}
                      className={clsx(
                        'w-full flex items-center justify-between border rounded-lg p-4 transition-all text-left',
                        selectedRate?.id === rate.id
                          ? 'border-primary-900 bg-primary-50'
                          : 'border-border hover:border-primary-300'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-primary-900">{rate.name}</p>
                        <p className="text-xs text-muted mt-0.5">{rate.description}</p>
                        {rate.estimatedDays && (
                          <p className="text-xs text-muted">{rate.estimatedDays} {t('checkout.businessDays')}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary-900">
                        {parseFloat(rate.price) === 0 ? t('checkout.free') : `${parseFloat(rate.price).toFixed(2)} GEL`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setStep('info')}>
                  {t('checkout.back')}
                </Button>
                <Button
                  size="lg"
                  onClick={() => goToStep('payment')}
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                >
                  {t('checkout.continueToPayment')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('checkout.paymentMethod')}</h2>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.name}
                    onClick={() => setSelectedPayment(method.name)}
                    className={clsx(
                      'w-full flex items-center justify-between border rounded-lg p-4 transition-all text-left',
                      selectedPayment === method.name
                        ? 'border-primary-900 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                    )}
                  >
                    <span className="text-sm font-medium text-primary-900">{method.label}</span>
                    <span className={clsx(
                      'w-4 h-4 rounded-full border-2 transition-colors',
                      selectedPayment === method.name
                        ? 'border-primary-900 bg-primary-900'
                        : 'border-primary-300'
                    )} />
                  </button>
                ))}
              </div>

              <Input
                label={t('checkout.orderNotes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('checkout.orderNotesPlaceholder')}
              />

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setStep('shipping')}>
                  {t('checkout.back')}
                </Button>
                <Button
                  size="lg"
                  onClick={handlePlaceOrder}
                  loading={submitting}
                >
                  {t('checkout.placeOrder')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-surface rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              {t('checkout.orderSummary', { count: items.length })}
            </h3>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const price = item.variant_id
                  ? (item.variant_price || item.product_price)
                  : (item.sale_price || item.product_price);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-primary-100 rounded-md overflow-hidden flex-shrink-0">
                      {(item.image?.thumbnail_url || item.image?.url) && (
                        <img src={item.image.thumbnail_url || item.image.url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary-900 truncate">{item.name}</p>
                      {item.variant_name && (
                        <p className="text-xs text-muted">{item.variant_name}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-primary-900">
                      {(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <hr className="border-border my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-primary-600">{t('cart.subtotal')}</span>
                <span className="text-primary-900">{subtotal.toFixed(2)} GEL</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>{t('orderDetail.discount')}</span>
                  <span>-{discountAmount.toFixed(2)} GEL</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-primary-600">{t('checkout.shipping')}</span>
                <span className="text-primary-900">
                  {selectedRate ? (parseFloat(selectedRate.price) === 0 ? t('checkout.free') : `${parseFloat(selectedRate.price).toFixed(2)} GEL`) : '—'}
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-primary-900">{t('cart.total')}</span>
                <span className="font-semibold text-primary-900">{total.toFixed(2)} GEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
