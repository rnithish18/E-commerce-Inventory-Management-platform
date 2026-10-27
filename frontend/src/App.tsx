import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { StorefrontLayout } from './components/layout/StorefrontLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { FullPageSpinner } from './components/ui/Spinner';

// Route Code Splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage').then(m => ({ default: m.MyOrdersPage })));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory').then(m => ({ default: m.AdminInventory })));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminPlaceholder = lazy(() => import('./pages/admin/AdminPlaceholder').then(m => ({ default: m.AdminPlaceholder })));

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                
                {/* Customer Storefront Layout */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route 
                    path="/checkout" 
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/order-confirmation/:id" 
                    element={
                      <ProtectedRoute>
                        <OrderConfirmationPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedRoute>
                        <MyOrdersPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/wishlist" 
                    element={
                      <ProtectedRoute>
                        <WishlistPage />
                      </ProtectedRoute>
                    } 
                  />
                </Route>

                {/* Authentication Pages (Standalone) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Admin Dashboard Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route 
                    path="customers" 
                    element={
                      <AdminPlaceholder 
                        title="Customer Directory" 
                        description="View user accounts, addresses, and order history." 
                      />
                    } 
                  />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route 
                    path="settings" 
                    element={
                      <AdminPlaceholder 
                        title="Store Configuration" 
                        description="Razorpay test keys, shipping fees, and tax settings." 
                      />
                    } 
                  />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
