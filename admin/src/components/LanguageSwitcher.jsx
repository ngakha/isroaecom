import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isKa = i18n.language === 'ka';

  return (
    <button
      onClick={() => i18n.changeLanguage(isKa ? 'en' : 'ka')}
      className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded border border-gray-300 hover:border-gray-400"
    >
      {isKa ? 'EN' : 'GE'}
    </button>
  );
}
