import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary-950 text-primary-300 mt-auto">
      <div className="max-w-container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-tight">PRSHARK</h3>
            <p className="text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">{t('footer.shop')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="text-sm hover:text-white transition-colors">
                {t('footer.allProducts')}
              </Link>
              <Link to="/shop?sortBy=created_at&sortOrder=desc" className="text-sm hover:text-white transition-colors">
                {t('footer.newArrivals')}
              </Link>
              <Link to="/shop?sale=true" className="text-sm hover:text-white transition-colors">
                {t('footer.sale')}
              </Link>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">{t('footer.account')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/account" className="text-sm hover:text-white transition-colors">
                {t('footer.myAccount')}
              </Link>
              <Link to="/account?tab=orders" className="text-sm hover:text-white transition-colors">
                {t('footer.orderHistory')}
              </Link>
              <Link to="/account?tab=wishlist" className="text-sm hover:text-white transition-colors">
                {t('footer.wishlist')}
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">{t('footer.help')}</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm">{t('footer.shippingDelivery')}</span>
              <span className="text-sm">{t('footer.returnsExchanges')}</span>
              <span className="text-sm">{t('footer.contactUs')}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-primary-800">
          <p className="text-xs text-primary-500 text-center">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-primary-500 text-center mt-2">
            {t('footer.builtBy')}{' '}
            <a href="https://prshark.online" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
              PRShark Agency
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
