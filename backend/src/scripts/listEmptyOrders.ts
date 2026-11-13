import 'dotenv/config';
import { query } from '../db/query';

async function main() {
  const confirm = process.argv.includes('--confirm');
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  const cutoff = new Date(cutoffMs);

  const res = await query<{
    id: string;
    created_at: string;
    status: string;
    total_paise: string;
    item_count: string;
  }>(
    `SELECT o.id,
            o.created_at,
            o.status,
            o.total_paise,
            COUNT(oi.id) AS item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status = 'PENDING_PAYMENT'
       AND o.created_at < $1
     GROUP BY o.id
     HAVING COUNT(oi.id) = 0
     ORDER BY o.created_at ASC`,
    [cutoff]
  );

  if (res.rows.length === 0) {
    console.log('\u2705  No empty PENDING_PAYMENT orders older than 24 hours found.');
    process.exit(0);
  }

  console.log(`\nFound ${res.rows.length} empty PENDING_PAYMENT order(s) older than 24 h:\n`);
  console.table(
    res.rows.map((r) => ({
      id: r.id,
      created: new Date(r.created_at).toISOString(),
      status: r.status,
      total: `\u20B9${(Number(r.total_paise) / 100).toFixed(2)}`,
      items: Number(r.item_count),
    }))
  );

  if (!confirm) {
    console.log('\n\u26A0\uFE0F  Dry run. Run with --confirm to cancel these orders via the state machine.');
    process.exit(0);
  }

  let cancelled = 0;
  for (const order of res.rows) {
    await query(
      `UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING_PAYMENT'`,
      [order.id]
    );
    console.log(`Cancelled order ${order.id}`);
    cancelled++;
  }
  console.log(`\n\u2705  Cancelled ${cancelled} empty order(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
