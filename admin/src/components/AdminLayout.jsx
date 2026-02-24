import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import useNotifications from '../hooks/useNotifications';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Image, Settings, LogOut, Menu, X, FolderTree, Truck, CreditCard, Shield, Presentation, PhoneCall
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'shop_manager', 'content_editor'] },
  { key: 'products', href: '/products', icon: Package, roles: ['super_admin', 'shop_manager', 'content_editor'] },
  { key: 'categories', href: '/categories', icon: FolderTree, roles: ['super_admin', 'shop_manager', 'content_editor'] },
  { key: 'orders', href: '/orders', icon: ShoppingCart, roles: ['super_admin', 'shop_manager'] },
  { key: 'customers', href: '/customers', icon: Users, roles: ['super_admin', 'shop_manager'] },
  { key: 'discounts', href: '/discounts', icon: Tag, roles: ['super_admin', 'shop_manager'] },
  { key: 'shipping', href: '/shipping', icon: Truck, roles: ['super_admin', 'shop_manager'] },
  { key: 'payments', href: '/payments', icon: CreditCard, roles: ['super_admin', 'shop_manager'] },
  { key: 'media', href: '/media', icon: Image, roles: ['super_admin', 'shop_manager', 'content_editor'] },
  { key: 'callRequests', href: '/call-requests', icon: PhoneCall, roles: ['super_admin', 'shop_manager'] },
  { key: 'heroBanner', href: '/heroes', icon: Presentation, roles: ['super_admin'] },
  { key: 'adminUsers', href: '/admin-users', icon: Shield, roles: ['super_admin'] },
  { key: 'settings', href: '/settings', icon: Settings, roles: ['super_admin', 'shop_manager'] },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  useNotifications();

  const pendingOrders = useNotificationStore((s) => s.pendingOrders);
  const newCallRequests = useNotificationStore((s) => s.newCallRequests);
  const fetchCounts = useNotificationStore((s) => s.fetchCounts);

  useEffect(() => {
    fetchCounts();
  }, []);

  // Refetch counts when navigating to orders or call-requests pages
  useEffect(() => {
    if (location.pathname === '/orders' || location.pathname === '/call-requests') {
      fetchCounts();
    }
  }, [location.pathname]);

  const role = user?.role || '';
  const navigation = navItems.filter((item) => item.roles.includes(role));

  const getBadge = (href) => {
    if (href === '/orders' && pendingOrders > 0) return pendingOrders;
    if (href === '/call-requests' && newCallRequests > 0) return newCallRequests;
    return 0;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <h1 className="text-lg font-bold">{t('nav.storeName')}</h1>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            const badge = getBadge(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                <span className="flex-1">{t('nav.' + item.key)}</span>
                {badge > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-gray-400 text-xs">{role.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              title={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
