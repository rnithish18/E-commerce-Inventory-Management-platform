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
import aiRoutes from './routes/ai';
import adminProductRoutes from './routes/admin/products';
import adminOrderRoutes from './routes/admin/orders';
import adminInventoryRoutes from './routes/admin/inventory';
import adminCouponRoutes from './routes/admin/coupons';
import adminReviewRoutes from './routes/admin/reviews';
import adminDashboardRoutes from './routes/admin/dashboard';
import adminAnalyticsRoutes from './routes/admin/analytics';
import webhookRoutes from './routes/webhooks';
import {
  authLimiter,
  couponLimiter,
  paymentLimiter,
  uploadLimiter,
  aiLimiter,
  csrfProtection,
} from './middleware/security';
import { query } from './db/query';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
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

// Anti-CSRF Origin Guard
app.use(csrfProtection);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads with client caching headers
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: 86400000,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);

// Health check handler
const healthHandler = async (_req: express.Request, res: express.Response) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Dynamic sitemap.xml generated directly from PostgreSQL
app.get('/sitemap.xml', async (_req: express.Request, res: express.Response) => {
  try {
    const [catsResult, prodsResult] = await Promise.all([
      query<{ slug: string; created_at: string }>('SELECT slug, created_at FROM categories ORDER BY name ASC'),
      query<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM products WHERE is_active = true ORDER BY name ASC'),
    ]);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const now = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
      { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily', lastmod: now },
      { loc: `${baseUrl}/image-credits`, priority: '0.7', changefreq: 'weekly', lastmod: now },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const r of staticRoutes) {
      xml += '  <url>\n';
      xml += `    <loc>${r.loc}</loc>\n`;
      xml += `    <lastmod>${r.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
      xml += `    <priority>${r.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    for (const cat of catsResult.rows) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/shop?category=${encodeURIComponent(cat.slug)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    for (const p of prodsResult.rows) {
      const pDate = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : now;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/${encodeURIComponent(p.slug)}</loc>\n`;
      xml += `    <lastmod>${pDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Failed to generate dynamic sitemap.xml:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// API routes with rate limiters
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/payments', paymentLimiter, paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/wishlists', wishlistRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/coupons', couponLimiter, couponRoutes);
app.use('/api/v1/uploads', uploadLimiter, uploadRoutes);
app.use('/api/v1/ai', aiLimiter, aiRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/inventory', adminInventoryRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'The requested endpoint does not exist' });
});

// Error handler
app.use(errorHandler);

export default app;
