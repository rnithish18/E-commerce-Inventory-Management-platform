import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlists';
import couponRoutes from './routes/coupons';
import addressRoutes from './routes/addresses';
import paymentRoutes from './routes/payments';
import uploadRoutes from './routes/uploads';
import adminProductRoutes from './routes/admin/products';
import adminOrderRoutes from './routes/admin/orders';
import adminInventoryRoutes from './routes/admin/inventory';
import adminCouponRoutes from './routes/admin/coupons';
import adminReviewRoutes from './routes/admin/reviews';
import adminDashboardRoutes from './routes/admin/dashboard';
import webhookRoutes from './routes/webhooks';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/wishlists', wishlistRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/inventory', adminInventoryRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'The requested endpoint does not exist' });
});

// Error handler
app.use(errorHandler);

export default app;
