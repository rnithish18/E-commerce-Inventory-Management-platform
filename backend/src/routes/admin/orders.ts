import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../db/query';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { transitionOrderStatus, cancelOrderWithRestock, OrderStatus } from '../../services/orderStateMachine';
import { approveRefund } from '../../services/refund';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/v1/admin/orders
router.get('/', async (req, res, next) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(o.id::text ILIKE $${idx} OR u.email ILIKE $${idx} OR u.full_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT o.id, o.status, o.total_paise, o.created_at, o.updated_at,
              u.email, u.full_name, COUNT(oi.id)::int as item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.email, u.full_name
       ORDER BY o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    res.json({ orders: result.rows });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const orderRes = await query(
      `SELECT o.*, u.email, u.full_name,
              a.full_name as shipping_name, a.line1, a.city, a.state, a.pincode, a.phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (orderRes.rows.length === 0) throw new AppError(404, 'Order not found', 'NOT_FOUND');

    const [items, payments, tracking, audit] = await Promise.all([
      query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]),
      query('SELECT * FROM payment_attempts WHERE order_id = $1 ORDER BY created_at DESC', [req.params.id]),
      query('SELECT * FROM shipment_tracking_events WHERE order_id = $1 ORDER BY created_at ASC', [req.params.id]),
      query(`SELECT al.*, u.email as actor_email FROM audit_log al
             LEFT JOIN users u ON al.actor_user_id = u.id
             WHERE al.entity_id = $1 ORDER BY al.created_at ASC`, [req.params.id]),
    ]);

    res.json({
      order: {
        ...orderRes.rows[0],
        items: items.rows,
        payments: payments.rows,
        tracking: tracking.rows,
        audit: audit.rows,
      },
    });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/orders/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    await transitionOrderStatus(req.params.id, status as OrderStatus, req.user!.userId, note);
    res.json({ message: `Order transitioned to ${status}` });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/orders/:id/cancel
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { reason } = req.body;
    await cancelOrderWithRestock(req.params.id, req.user!.userId, reason || 'Admin cancelled order');
    res.json({ message: 'Order cancelled and stock released' });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/orders/:id/approve-refund
router.post('/:id/approve-refund', async (req, res, next) => {
  try {
    await approveRefund(req.params.id, req.user!.userId);
    res.json({ message: 'Refund approved, stock restocked' });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/orders/:id/tracking
router.post('/:id/tracking', async (req, res, next) => {
  try {
    const { status, location, description } = req.body;
    await query(
      `INSERT INTO shipment_tracking_events (id, order_id, status, location, description, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), req.params.id, status, location || null, description || null, req.user!.userId]
    );
    res.json({ message: 'Tracking event added' });
  } catch (err) { next(err); }
});

export default router;
