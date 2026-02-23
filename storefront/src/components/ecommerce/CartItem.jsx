import { Trash2 } from 'lucide-react';
import QuantitySelector from './QuantitySelector';
import PriceDisplay from './PriceDisplay';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

export default function CartItem({ item }) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const price = item.variant_id
    ? (item.variant_price || item.product_price)
    : (item.sale_price || item.product_price);
  const lineTotal = price * item.quantity;

  const handleQuantityChange = async (qty) => {
    try {
      await updateItem(item.id, qty);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async () => {
    await removeItem(item.id);
    toast.success('Item removed');
  };

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 bg-surface rounded-md overflow-hidden">
        {item.image?.thumbnail_url || item.image?.url ? (
          <img src={item.image.thumbnail_url || item.image.url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-primary-900 truncate">{item.name}</h4>
        {item.variant_name && (
          <p className="text-xs text-muted mt-0.5">{item.variant_name}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            max={item.stock_quantity || 99}
          />
          <div className="flex items-center gap-3">
            <PriceDisplay price={lineTotal} size="sm" />
            <button
              onClick={handleRemove}
              className="p-1.5 text-muted hover:text-error transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
