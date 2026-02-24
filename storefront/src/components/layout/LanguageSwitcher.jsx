import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isKa = i18n.language === 'ka';

  return (
    <button
      onClick={() => i18n.changeLanguage(isKa ? 'en' : 'ka')}
      className="text-xs font-medium text-primary-600 hover:text-primary-900 transition-colors px-1.5 py-1 rounded border border-border hover:border-primary-300"
    >
      {isKa ? 'EN' : 'GE'}
    </button>
  );
}
