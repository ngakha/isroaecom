import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const { t } = useTranslation();
  const whatsappNumber = useSettingsStore((s) => s.whatsappNumber);

  if (!whatsappNumber) return null;

  const defaultMessage = 'გამარჯობა! მაინტერესებს თქვენი პროდუქცია.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 whitespace-nowrap text-sm text-gray-700">
          {t('whatsapp.tooltip')}
        </div>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.917 15.917 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.302 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.666-1.218-4.758-1.972-7.818-6.808-8.054-7.122-.228-.314-1.906-2.54-1.906-4.844s1.208-3.436 1.636-3.906c.428-.47.936-.588 1.248-.588.312 0 .624.002.898.016.288.016.674-.11 1.054.804.39.938 1.326 3.242 1.444 3.476.116.234.194.508.038.82-.156.314-.234.508-.468.784-.234.274-.492.614-.702.824-.234.234-.478.488-.204.958.274.468 1.218 2.012 2.618 3.26 1.798 1.602 3.314 2.098 3.784 2.332.468.234.742.196 1.016-.118.274-.314 1.17-1.366 1.482-1.836.312-.468.624-.39 1.054-.234.428.156 2.732 1.288 3.2 1.522.468.234.78.352.898.546.116.194.116 1.124-.274 2.224z" />
        </svg>
      </a>
    </div>
  );
}
