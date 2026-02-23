import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-primary-300 mt-auto">
      <div className="max-w-container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-tight">PRSHARK</h3>
            <p className="text-sm leading-relaxed">
              Premium products curated for modern living. Quality meets simplicity.
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">Shop</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="text-sm hover:text-white transition-colors">
                All Products
              </Link>
              <Link to="/shop?sortBy=created_at&sortOrder=desc" className="text-sm hover:text-white transition-colors">
                New Arrivals
              </Link>
              <Link to="/shop?sale=true" className="text-sm hover:text-white transition-colors">
                Sale
              </Link>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">Account</h4>
            <div className="flex flex-col gap-2">
              <Link to="/account" className="text-sm hover:text-white transition-colors">
                My Account
              </Link>
              <Link to="/account?tab=orders" className="text-sm hover:text-white transition-colors">
                Order History
              </Link>
              <Link to="/account?tab=wishlist" className="text-sm hover:text-white transition-colors">
                Wishlist
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider">Help</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm">Shipping & Delivery</span>
              <span className="text-sm">Returns & Exchanges</span>
              <span className="text-sm">Contact Us</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-primary-800">
          <p className="text-xs text-primary-500 text-center">
            &copy; {new Date().getFullYear()} PRShark. All rights reserved.
          </p>
          <p className="text-xs text-primary-500 text-center mt-2">
            Built by{' '}
            <a href="https://prshark.online" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
              PRShark Agency
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
