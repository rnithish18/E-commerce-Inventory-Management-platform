import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StorefrontLayout } from './components/layout/StorefrontLayout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';
import { CustomerPlaceholder } from './pages/CustomerPlaceholder';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        
        {/* Customer Storefront Layout */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route 
            path="/cart" 
            element={
              <CustomerPlaceholder 
                title="Your Shopping Cart" 
                subtitle="Manage item quantities, apply coupons, and launch checkout." 
                phase="Week 2" 
              />
            } 
          />
          <Route 
            path="/orders" 
            element={
              <CustomerPlaceholder 
                title="Order History & Tracking" 
                subtitle="Track live order status, shipment events, and download invoices." 
                phase="Week 2" 
              />
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <CustomerPlaceholder 
                title="Your Wishlist" 
                subtitle="Save your favorite products for future purchases." 
                phase="Week 3" 
              />
            } 
          />
        </Route>

        {/* Authentication Pages (Standalone) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          <Route 
            path="products" 
            element={
              <AdminPlaceholder 
                title="Product Catalog Management" 
                description="Manage products, pricing, categories, and images." 
              />
            } 
          />
          <Route 
            path="orders" 
            element={
              <AdminPlaceholder 
                title="Order Processing & Fulfillment" 
                description="Update order states, tracking numbers, and refunds." 
              />
            } 
          />
          <Route 
            path="inventory" 
            element={
              <AdminPlaceholder 
                title="Inventory & Stock Movement" 
                description="View inventory movements, stock levels, and set thresholds." 
              />
            } 
          />
          <Route 
            path="customers" 
            element={
              <AdminPlaceholder 
                title="Customer Directory" 
                description="View user accounts, addresses, and order history." 
              />
            } 
          />
          <Route 
            path="coupons" 
            element={
              <AdminPlaceholder 
                title="Coupon & Promotion Engine" 
                description="Create and manage coupon codes like WELCOME10." 
              />
            } 
          />
          <Route 
            path="reviews" 
            element={
              <AdminPlaceholder 
                title="Review Moderation" 
                description="Approve, reject, or hide customer product reviews." 
              />
            } 
          />
          <Route 
            path="analytics" 
            element={
              <AdminPlaceholder 
                title="Sales & Business Analytics" 
                description="Gross turnover, conversion rates, and inventory exposure." 
              />
            } 
          />
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
    </AuthProvider>
  );
}
