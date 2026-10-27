import nodemailer, { type Transporter } from 'nodemailer';
import { query } from '../db/query';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'ShopNest Store <no-reply@shopnest.com>';

  if (mailer) {
    try {
      await mailer.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`[SMTP Mailer] Real email dispatched to ${options.to}: "${options.subject}"`);
      return;
    } catch (err) {
      console.error(`[SMTP Mailer Error] Failed sending to ${options.to}:`, err);
    }
  }

  // Fallback to Development Console Mailer
  console.log(
    `📧 [Dev Mailer / Console Fallback] (SMTP_HOST unset): To: ${options.to} | Subject: "${options.subject}"\n   Body: ${options.text.replace(/\n+/g, ' ')}`
  );
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

    await sendMail({
      to: order.email,
      subject: `Order Confirmed: #${shortId} (₹${amountRs})`,
      text: `Hello ${order.full_name},\n\nYour ShopNest order #${shortId} of ₹${amountRs} is confirmed and is being processed.\n\nThank you for shopping with ShopNest!`
    });
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

    await sendMail({
      to: order.email,
      subject: `Order Update: #${shortId} is now ${newStatus}`,
      text: `Hello ${order.full_name},\n\nYour order #${shortId} has transitioned to: ${newStatus}.\nTrack your delivery in real-time on ShopNest.`
    });
  } catch (err) {
    console.error('Failed to dispatch order status change email:', err);
  }
}
