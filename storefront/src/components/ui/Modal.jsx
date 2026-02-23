import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const sizeStyles = {
  sm: 'max-w-[400px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handler = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handler);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          'relative w-full bg-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200',
          sizeStyles[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted hover:text-primary-900 hover:bg-primary-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
