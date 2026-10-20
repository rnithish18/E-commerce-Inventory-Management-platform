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
    const [ordersRes, customersRes, lowStockRes] = await Promise.all([
      query<DashboardKpi>(
        `SELECT COUNT(*) as total_orders,
                COALESCE(SUM(CASE WHEN status NOT IN ('PENDING_PAYMENT','CANCELLED') THEN total_paise END), 0)::bigint as total_sales_paise
         FROM orders`
      ),
      query<{ total_customers: string }>(`SELECT COUNT(*) as total_customers FROM users WHERE role = 'CUSTOMER'`),
      query<{ low_stock_count: string }>(`SELECT COUNT(*) as low_stock_count FROM product_variants WHERE stock_qty <= reorder_threshold AND stock_qty >= 0`),
    ]);

    res.json({
      total_orders: parseInt(ordersRes.rows[0]?.total_orders ?? '0', 10),
      total_sales_paise: parseInt(ordersRes.rows[0]?.total_sales_paise ?? '0', 10),
      total_customers: parseInt(customersRes.rows[0]?.total_customers ?? '0', 10),
      low_stock_count: parseInt(lowStockRes.rows[0]?.low_stock_count ?? '0', 10),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
