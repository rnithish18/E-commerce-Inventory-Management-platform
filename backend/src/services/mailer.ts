import { query } from '../db/query';

interface OrderMailData {
  id: string;
  total_paise: number;
  user_email?: string;
  status?: string;
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const res = await query<{
      id: string;
      total_paise: number;
      status: string;
      email: string;
      full_name: string;
    }>(
      `SELECT o.id, o.total_paise, o.status, u.email, u.full_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (res.rows.length === 0) return;
    const order = res.rows[0];
    const shortId = order.id.slice(0, 8).toUpperCase();
    const amountRs = (order.total_paise / 100).toFixed(2);

    console.log(
      `📧 [Dev Mailer] Order Confirmed: Sent to ${order.email} (Order #${shortId}, Amount: ₹${amountRs}, Recipient: ${order.full_name})`
    );
  } catch (err) {
    console.error('Failed to dispatch order confirmation email:', err);
  }
}

export async function sendOrderStatusChangeEmail(orderId: string, newStatus: string): Promise<void> {
  try {
    const res = await query<{
      id: string;
      email: string;
      full_name: string;
    }>(
      `SELECT o.id, u.email, u.full_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (res.rows.length === 0) return;
    const order = res.rows[0];
    const shortId = order.id.slice(0, 8).toUpperCase();

    console.log(
      `📧 [Dev Mailer] Order Status Update: Sent to ${order.email} (Order #${shortId} status transitioned to: ${newStatus})`
    );
  } catch (err) {
    console.error('Failed to dispatch order status change email:', err);
  }
}
