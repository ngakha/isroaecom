import { useState } from 'react';
import { PhoneCall, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CallRequestModal({ product, isOpen, onClose }) {
  const [form, setForm] = useState({ customerName: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setForm({ customerName: '', phone: '', message: '' });
    setSuccess(false);
    onClose();
  };

  const validateForm = () => {
    const name = form.customerName.trim();
    const phone = form.phone.trim().replace(/\s/g, '');

    // Name: only letters, min 2 words
    const nameRegex = /^[\p{L}][\p{L}\s\-]{1,}[\p{L}]$/u;
    if (!nameRegex.test(name) || name.split(/\s+/).length < 2) {
      toast.error('გთხოვთ მიუთითოთ სახელი და გვარი');
      return false;
    }

    // Phone: Georgian format +995 5XXXXXXXX or 5XXXXXXXX
    const phoneRegex = /^(?:\+995)?5\d{8}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('გთხოვთ მიუთითოთ ქართული ტელეფონის ნომერი (მაგ: +995 5XX XXX XXX)');
      return false;
    }

    return true;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\s]/g, '');
    setForm((p) => ({ ...p, phone: value }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\u10A0-\u10FF\u2D00-\u2D2F\s\-]/g, '');
    setForm((p) => ({ ...p, customerName: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post('/call-requests', {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || null,
        productId: product?.id || null,
        productName: product?.name || null,
      });
      setSuccess(true);
      setTimeout(handleClose, 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={success ? undefined : 'Request a Call'} size="sm">
      {success ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-primary-900 mb-1">Thank You!</h3>
          <p className="text-sm text-muted">Our operator will contact you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {product && (
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
              {product.images?.[0] ? (
                <img src={product.images[0].url} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-muted">
                  <PhoneCall size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">{product.name}</p>
                {product.price && (
                  <p className="text-xs text-muted">{product.sale_price || product.price} GEL</p>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-primary-600">
            Would you like our operator to contact you? Please leave your details and we'll call you back.
          </p>

          <div>
            <label className="block text-sm font-medium text-primary-900 mb-1">Your Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="სახელი გვარი"
              value={form.customerName}
              onChange={handleNameChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-900 mb-1">Phone Number *</label>
            <input
              type="tel"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="+995 5XX XXX XXX"
              value={form.phone}
              onChange={handlePhoneChange}
              maxLength={16}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-900 mb-1">Message (optional)</label>
            <textarea
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 h-20 resize-none"
              placeholder="Any additional details..."
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <PhoneCall size={16} />
                Request a Call
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
