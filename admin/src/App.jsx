import './i18n';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductFormPage from './pages/Products/ProductFormPage';
import CategoriesPage from './pages/Products/CategoriesPage';
import OrdersPage from './pages/Orders/OrdersPage';
import OrderDetailPage from './pages/Orders/OrderDetailPage';
import CreateOrderPage from './pages/Orders/CreateOrderPage';
import CustomersPage from './pages/Customers/CustomersPage';
import DiscountsPage from './pages/Discounts/DiscountsPage';
import MediaPage from './pages/Media/MediaPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ShippingZonesPage from './pages/Shipping/ShippingZonesPage';
import AdminUsersPage from './pages/AdminUsers/AdminUsersPage';
import PaymentConfigPage from './pages/Payments/PaymentConfigPage';
import HeroSlidesPage from './pages/Heroes/HeroSlidesPage';
import CallRequestsPage from './pages/CallRequests/CallRequestsPage';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuthStore();
  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/media" element={<MediaPage />} />

                {/* shop_manager+ only */}
                <Route path="/orders" element={<RoleRoute roles={['super_admin', 'shop_manager']}><OrdersPage /></RoleRoute>} />
                <Route path="/orders/create" element={<RoleRoute roles={['super_admin', 'shop_manager']}><CreateOrderPage /></RoleRoute>} />
                <Route path="/orders/:id" element={<RoleRoute roles={['super_admin', 'shop_manager']}><OrderDetailPage /></RoleRoute>} />
                <Route path="/customers" element={<RoleRoute roles={['super_admin', 'shop_manager']}><CustomersPage /></RoleRoute>} />
                <Route path="/discounts" element={<RoleRoute roles={['super_admin', 'shop_manager']}><DiscountsPage /></RoleRoute>} />
                <Route path="/shipping" element={<RoleRoute roles={['super_admin', 'shop_manager']}><ShippingZonesPage /></RoleRoute>} />
                <Route path="/payments" element={<RoleRoute roles={['super_admin', 'shop_manager']}><PaymentConfigPage /></RoleRoute>} />
                <Route path="/call-requests" element={<RoleRoute roles={['super_admin', 'shop_manager']}><CallRequestsPage /></RoleRoute>} />
                <Route path="/settings" element={<RoleRoute roles={['super_admin', 'shop_manager']}><SettingsPage /></RoleRoute>} />

                {/* super_admin only */}
                <Route path="/heroes" element={<RoleRoute roles={['super_admin']}><HeroSlidesPage /></RoleRoute>} />
                <Route path="/admin-users" element={<RoleRoute roles={['super_admin']}><AdminUsersPage /></RoleRoute>} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
