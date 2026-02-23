import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useSettingsStore } from '../../store/settingsStore';
import LiveSearch from './LiveSearch';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const customer = useAuthStore((s) => s.customer);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const callRequestMode = useSettingsStore((s) => s.callRequestMode);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      {/* Top bar */}
      <div className="max-w-container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-primary-700 hover:text-primary-900"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="text-xl font-semibold tracking-tight text-primary-900">
            PRSHARK
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/shop" className="text-sm text-primary-600 hover:text-primary-900 transition-colors">
              Shop
            </Link>
            <Link to="/shop?status=published&sortBy=created_at&sortOrder=desc" className="text-sm text-primary-600 hover:text-primary-900 transition-colors">
              New Arrivals
            </Link>
            <Link to="/shop?sale=true" className="text-sm text-primary-600 hover:text-primary-900 transition-colors">
              Sale
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-primary-600 hover:text-primary-900 transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Wishlist */}
            {customer && (
              <Link
                to="/account?tab=wishlist"
                className="relative p-2 text-primary-600 hover:text-primary-900 transition-colors hidden sm:block"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-primary-900 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px]">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart (hidden in call request mode) */}
            {!callRequestMode && (
              <Link
                to="/cart"
                className="relative p-2 text-primary-600 hover:text-primary-900 transition-colors"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-primary-900 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px]">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Account */}
            <div className="relative">
              {customer ? (
                <>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="p-2 text-primary-600 hover:text-primary-900 transition-colors"
                  >
                    <User size={20} />
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-sm font-medium text-primary-900">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-muted">{customer.email}</p>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          <User size={15} />
                          My Account
                        </Link>
                        <Link
                          to="/account?tab=orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          <ShoppingBag size={15} />
                          Orders
                        </Link>
                        <Link
                          to="/account?tab=wishlist"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          <Heart size={15} />
                          Wishlist
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-red-50"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-primary-600 hover:text-primary-900 transition-colors"
                >
                  <User size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Search */}
      {searchOpen && (
        <LiveSearch onClose={() => setSearchOpen(false)} />
      )}

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          <nav className="max-w-container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link
              to="/shop"
              onClick={() => setMobileOpen(false)}
              className="text-base text-primary-700 hover:text-primary-900 py-1"
            >
              Shop
            </Link>
            <Link
              to="/shop?sortBy=created_at&sortOrder=desc"
              onClick={() => setMobileOpen(false)}
              className="text-base text-primary-700 hover:text-primary-900 py-1"
            >
              New Arrivals
            </Link>
            <Link
              to="/shop?sale=true"
              onClick={() => setMobileOpen(false)}
              className="text-base text-primary-700 hover:text-primary-900 py-1"
            >
              Sale
            </Link>
            {customer && (
              <>
                <hr className="border-border" />
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-primary-700 hover:text-primary-900 py-1"
                >
                  My Account
                </Link>
                <Link
                  to="/account?tab=wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-primary-700 hover:text-primary-900 py-1"
                >
                  Wishlist
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
