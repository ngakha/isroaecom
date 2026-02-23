import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { useCartStore } from './store/cartStore';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import { useSettingsStore } from './store/settingsStore';

function ProtectedRoute({ children }) {
  const customer = useAuthStore((s) => s.customer);
  if (!customer) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  const fetchCart = useCartStore((s) => s.fetchCart);
  const customer = useAuthStore((s) => s.customer);
  const fetchWishlist = useWishlistStore((s) => s.fetch);
  const resetWishlist = useWishlistStore((s) => s.reset);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  // Fetch cart and settings on app load
  useEffect(() => {
    fetchCart();
    fetchSettings();
  }, []);

  // Fetch wishlist when customer logs in, reset on logout
  useEffect(() => {
    if (customer) {
      fetchWishlist();
    } else {
      resetWishlist();
    }
  }, [customer]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.875rem',
            borderRadius: '6px',
            padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          },
          success: {
            style: { borderLeft: '3px solid #22c55e' },
          },
          error: {
            style: { borderLeft: '3px solid #ef4444' },
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/order/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
