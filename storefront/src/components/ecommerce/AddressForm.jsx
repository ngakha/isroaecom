import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useTranslation } from 'react-i18next';

export default function AddressForm({ address, onSubmit, onCancel, loading }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    label: address?.label || 'Home',
    firstName: address?.first_name || '',
    lastName: address?.last_name || '',
    addressLine1: address?.address_line1 || '',
    addressLine2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postal_code || '',
    country: address?.country || 'Georgia',
    phone: address?.phone || '',
    isDefault: address?.is_default || false,
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('address.firstName')}
          value={form.firstName}
          onChange={handleChange('firstName')}
          required
        />
        <Input
          label={t('address.lastName')}
          value={form.lastName}
          onChange={handleChange('lastName')}
          required
        />
      </div>

      <Input
        label={t('address.addressLine1')}
        value={form.addressLine1}
        onChange={handleChange('addressLine1')}
        required
      />
      <Input
        label={t('address.addressLine2')}
        value={form.addressLine2}
        onChange={handleChange('addressLine2')}
        placeholder={t('address.addressLine2Hint')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('address.city')}
          value={form.city}
          onChange={handleChange('city')}
          required
        />
        <Input
          label={t('address.state')}
          value={form.state}
          onChange={handleChange('state')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('address.postalCode')}
          value={form.postalCode}
          onChange={handleChange('postalCode')}
        />
        <Input
          label={t('address.country')}
          value={form.country}
          onChange={handleChange('country')}
          required
        />
      </div>

      <Input
        label={t('address.phone')}
        type="tel"
        value={form.phone}
        onChange={handleChange('phone')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('address.label')}
          value={form.label}
          onChange={handleChange('label')}
          placeholder={t('address.labelHint')}
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-primary-300 text-primary-900 focus:ring-primary-900"
            />
            <span className="text-sm text-primary-700">{t('address.setAsDefault')}</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {address ? t('address.updateAddress') : t('address.addAddress')}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('address.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
