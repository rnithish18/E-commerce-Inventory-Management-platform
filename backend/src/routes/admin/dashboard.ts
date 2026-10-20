import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { query } from '../../db/query';

const router = Router();
router.use(requireAuth, requireAdmin);

interface DashboardKpi {
  total_orders: string;
  total_sales_paise: string;
}

// GET /api/v1/admin/dashboard
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [ordersRes, customersRes, lowStockRes, lowStockListRes, topProductsRes] = await Promise.all([
      query<DashboardKpi>(
        `SELECT COUNT(*) as total_orders,
                COALESCE(SUM(CASE WHEN status NOT IN ('PENDING_PAYMENT','CANCELLED') THEN total_paise END), 0)::bigint as total_sales_paise
         FROM orders`
      ),
      query<{ total_customers: string }>(`SELECT COUNT(*) as total_customers FROM users WHERE role = 'CUSTOMER'`),
      query<{ low_stock_count: string }>(`SELECT COUNT(*) as low_stock_count FROM product_variants WHERE stock_qty <= reorder_threshold AND stock_qty >= 0`),
      query<{ name: string; sku: string; stock: number; threshold: number; category: string }>(
        `SELECT p.name, pv.sku, pv.stock_qty as stock, pv.reorder_threshold as threshold, COALESCE(c.name, 'Uncategorized') as category
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE pv.stock_qty <= pv.reorder_threshold
         ORDER BY pv.stock_qty ASC
         LIMIT 6`
      ),
      query<{ name: string; category: string; price_paise: number; stock: number }>(
        `SELECT p.name, COALESCE(c.name, 'General') as category, p.price_paise, COALESCE(pv.stock_qty, 0) as stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON p.id = pv.product_id
         WHERE p.is_active = true
         ORDER BY p.average_rating DESC NULLS LAST
         LIMIT 6`
      )
    ]);

    res.json({
      total_orders: parseInt(ordersRes.rows[0]?.total_orders ?? '0', 10),
      total_sales_paise: parseInt(ordersRes.rows[0]?.total_sales_paise ?? '0', 10),
      total_customers: parseInt(customersRes.rows[0]?.total_customers ?? '0', 10),
      low_stock_count: parseInt(lowStockRes.rows[0]?.low_stock_count ?? '0', 10),
      low_stock_items: lowStockListRes.rows,
      top_products: topProductsRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
