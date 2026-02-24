import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export default function SaleCountdown({ endDate, size = 'md', className }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;

    const calculate = () => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ days, hours, minutes });
    };

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  const d = t('sale.days');
  const h = t('sale.hours');
  const m = t('sale.minutes');
  const timeStr = timeLeft.days > 0
    ? `${timeLeft.days} ${d} ${timeLeft.hours}${h} ${timeLeft.minutes}${m}`
    : timeLeft.hours > 0
      ? `${timeLeft.hours}${h} ${timeLeft.minutes}${m}`
      : `${timeLeft.minutes}${m}`;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-medium',
      size === 'sm' ? 'text-[10px]' : 'text-xs',
      'text-red-600',
      className
    )}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}>
        <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
      </svg>
      {t('sale.endsIn', { time: timeStr })}
    </span>
  );
}
