import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function AddressForm({ address, onSubmit, onCancel, loading }) {
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
          label="First Name"
          value={form.firstName}
          onChange={handleChange('firstName')}
          required
        />
        <Input
          label="Last Name"
          value={form.lastName}
          onChange={handleChange('lastName')}
          required
        />
      </div>

      <Input
        label="Address Line 1"
        value={form.addressLine1}
        onChange={handleChange('addressLine1')}
        required
      />
      <Input
        label="Address Line 2"
        value={form.addressLine2}
        onChange={handleChange('addressLine2')}
        placeholder="Apartment, suite, etc. (optional)"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={handleChange('city')}
          required
        />
        <Input
          label="State / Region"
          value={form.state}
          onChange={handleChange('state')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal Code"
          value={form.postalCode}
          onChange={handleChange('postalCode')}
        />
        <Input
          label="Country"
          value={form.country}
          onChange={handleChange('country')}
          required
        />
      </div>

      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={handleChange('phone')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Label"
          value={form.label}
          onChange={handleChange('label')}
          placeholder="Home, Work, etc."
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-primary-300 text-primary-900 focus:ring-primary-900"
            />
            <span className="text-sm text-primary-700">Set as default</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {address ? 'Update Address' : 'Add Address'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
