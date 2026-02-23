import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ShoppingBag, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function LiveSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchResults = useCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/products/search', { params: { q } });
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchResults(value.trim());
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSelect = (slug) => {
    navigate(`/product/${slug}`);
    onClose();
  };

  const formatPrice = (p) => parseFloat(p).toFixed(2);

  return (
    <div className="border-t border-border bg-white">
      <div className="max-w-container mx-auto px-4 lg:px-6 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Search size={18} className="text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search products..."
            autoFocus
            className="flex-1 text-base outline-none placeholder:text-muted"
          />
          {loading && <Loader2 size={16} className="animate-spin text-muted flex-shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-primary-900 flex-shrink-0"
          >
            Cancel
          </button>
        </form>

        {/* Results dropdown */}
        {query.trim().length >= 2 && (
          <div className="mt-3 border-t border-border pt-3">
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-muted text-sm">
                <Loader2 size={16} className="animate-spin mr-2" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product.slug)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors text-left"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-surface flex items-center justify-center flex-shrink-0">
                        <ShoppingBag size={16} className="text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) ? (
                          <>
                            <span className="text-xs font-medium text-primary-900">
                              {formatPrice(product.sale_price)} GEL
                            </span>
                            <span className="text-xs text-muted line-through">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-primary-900">
                            {formatPrice(product.price)} GEL
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleSubmit}
                  className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-900 py-2 transition-colors"
                >
                  View all results for "{query}"
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-6">
                No products found for "{query}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
