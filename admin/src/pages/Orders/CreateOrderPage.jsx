import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PAYMENT_TYPES = [
  { value: 'on_delivery', labelKey: 'createOrder.onDelivery' },
  { value: 'warehouse_pickup', labelKey: 'createOrder.warehousePickup' },
  { value: 'bank_transfer', labelKey: 'createOrder.bankTransfer' },
];

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    productName: '',
    quantity: 1,
    price: '',
    address: '',
    phone: '',
    phone2: '',
    shippingAmount: '',
    paymentType: 'on_delivery',
    costPrice: '',
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const qty = parseInt(form.quantity) || 0;
  const price = parseFloat(form.price) || 0;
  const shipping = parseFloat(form.shippingAmount) || 0;
  const cost = parseFloat(form.costPrice) || 0;
  const total = price * qty;

  let profit = 0;
  if (form.paymentType === 'on_delivery') {
    profit = total * 0.98 - shipping - cost;
  } else {
    profit = total - shipping - cost;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.productName || !form.phone || !form.price) {
      toast.error(t('createOrder.fillRequired'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/orders/admin-create', {
        ...form,
        quantity: qty,
        price,
        shippingAmount: shipping,
        costPrice: cost,
      });
      toast.success(t('createOrder.created'));
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || t('createOrder.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{t('createOrder.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {/* Name */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.firstName')} *</label>
            <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.lastName')}</label>
            <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
        </div>

        {/* Product */}
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.productName')} *</label>
          <input className="input" placeholder={t('createOrder.productPlaceholder')} value={form.productName} onChange={(e) => set('productName', e.target.value)} />
        </div>

        {/* Qty, Price, Total */}
        <div className="p-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.quantity')}</label>
            <input type="number" className="input" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.price')} *</label>
            <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.total')}</label>
            <div className="input bg-gray-50 flex items-center font-semibold">{total.toFixed(2)} GEL</div>
          </div>
        </div>

        {/* Address */}
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.address')} *</label>
          <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>

        {/* Phones */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.phone1')} *</label>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.phone2')}</label>
            <input className="input" value={form.phone2} onChange={(e) => set('phone2', e.target.value)} />
          </div>
        </div>

        {/* Courier + Payment type */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.courierCost')}</label>
            <input type="number" step="0.01" className="input" value={form.shippingAmount} onChange={(e) => set('shippingAmount', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.paymentType')}</label>
            <select className="input" value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)}>
              {PAYMENT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{t(pt.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost price + Profit */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.costPrice')}</label>
            <input type="number" step="0.01" className="input" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('createOrder.profit')}</label>
            <div className={`input bg-gray-50 flex items-center font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit.toFixed(2)} GEL
            </div>
            {form.paymentType === 'on_delivery' && (
              <p className="text-xs text-gray-400 mt-1">{t('createOrder.onewayFee')}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/orders')} className="btn-secondary">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('common.saving') : t('createOrder.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
