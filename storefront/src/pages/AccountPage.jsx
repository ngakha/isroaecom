import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { User, ShoppingBag, Heart, MapPin, Lock, Package } from 'lucide-react';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ecommerce/EmptyState';
import AddressCard from '../components/ecommerce/AddressCard';
import AddressForm from '../components/ecommerce/AddressForm';
import OrderStatusBadge from '../components/ecommerce/OrderStatusBadge';
import ProductCard from '../components/ecommerce/ProductCard';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const customer = useAuthStore((s) => s.customer);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();

  const TABS = [
    { id: 'orders', label: t('account.orders'), icon: <Package size={16} /> },
    { id: 'addresses', label: t('account.addresses'), icon: <MapPin size={16} /> },
    { id: 'wishlist', label: t('account.wishlist'), icon: <Heart size={16} /> },
    { id: 'profile', label: t('account.profile'), icon: <User size={16} /> },
  ];

  const activeTab = searchParams.get('tab') || 'orders';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  if (!customer) {
    navigate('/login', { state: { from: '/account' } });
    return null;
  }

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">{t('account.myAccount')}</h1>
          <p className="text-sm text-muted mt-0.5">
            {t('account.welcome', { name: `${customer.firstName} ${customer.lastName}` })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={async () => { await logout(); navigate('/'); }}>
          {t('account.signOut')}
        </Button>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setTab} />

      <div className="py-6">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'addresses' && <AddressesTab />}
        {activeTab === 'wishlist' && <WishlistTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}

// ──── Orders Tab ─────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const customer = useAuthStore((s) => s.customer);
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/orders/my-orders', { params: { limit: 50 } })
      .then((res) => setOrders(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={32} />}
        title={t('account.noOrders')}
        description={t('account.noOrdersDesc')}
        action={{ label: t('account.startShopping'), onClick: () => window.location.href = '/shop' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/account/order/${order.id}`}
          className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary-300 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary-900">{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary-900">
            {parseFloat(order.total).toFixed(2)} {order.currency || 'GEL'}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ──── Addresses Tab ─────────────────────────────────
function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const { t } = useTranslation();

  const fetchAddresses = () => {
    setLoading(true);
    api.get('/customers/me/addresses')
      .then((res) => setAddresses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editAddress) {
        await api.put(`/customers/me/addresses/${editAddress.id}`, formData);
        toast.success('Address updated');
      } else {
        await api.post('/customers/me/addresses', formData);
        toast.success('Address added');
      }
      setShowForm(false);
      setEditAddress(null);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (address) => {
    if (!confirm('Delete this address?')) return;
    try {
      await api.delete(`/customers/me/addresses/${address.id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-primary-700">{t('account.savedAddresses', { count: addresses.length })}</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setEditAddress(null); setShowForm(true); }}
        >
          {t('account.addAddress')}
        </Button>
      </div>

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={<MapPin size={32} />}
          title={t('account.noAddresses')}
          description={t('account.noAddressesDesc')}
          action={{ label: t('account.addAddress'), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={(a) => { setEditAddress(a); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditAddress(null); }}
        title={editAddress ? t('account.editAddress') : t('account.addAddress')}
        size="lg"
      >
        <AddressForm
          address={editAddress}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditAddress(null); }}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

// ──── Wishlist Tab ──────────────────────────────────
function WishlistTab() {
  const wishlist = useWishlistStore((s) => s.items);
  const loaded = useWishlistStore((s) => s.loaded);
  const fetchWishlist = useWishlistStore((s) => s.fetch);
  const { t } = useTranslation();

  useEffect(() => { if (!loaded) fetchWishlist(); }, []);

  if (!loaded) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={32} />}
        title={t('account.wishlistEmpty')}
        description={t('account.wishlistEmptyDesc')}
        action={{ label: t('account.browseProducts'), onClick: () => window.location.href = '/shop' }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {wishlist.map((product) => (
        <ProductCard key={product.id} product={product} onWishlistChange={fetchWishlist} />
      ))}
    </div>
  );
}

// ──── Profile Tab ──────────────────────────────────
function ProfileTab() {
  const customer = useAuthStore((s) => s.customer);
  const updateCustomer = useAuthStore((s) => s.updateCustomer);
  const { t } = useTranslation();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('account.passwordsMismatch'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('account.passwordMinLength'));
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('account.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('account.passwordChangeFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile Info */}
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">{t('account.profileInfo')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center">
            <span className="text-muted w-32">{t('account.name')}</span>
            <span className="text-primary-900">{customer.firstName} {customer.lastName}</span>
          </div>
          <div className="flex items-center">
            <span className="text-muted w-32">Email</span>
            <span className="text-primary-900">{customer.email}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <Lock size={18} />
          {t('account.changePassword')}
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label={t('account.currentPassword')}
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
          />
          <Input
            label={t('account.newPassword')}
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            required
          />
          <Input
            label={t('account.confirmNewPassword')}
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" loading={changingPassword}>
            {t('account.updatePassword')}
          </Button>
        </form>
      </div>
    </div>
  );
}
