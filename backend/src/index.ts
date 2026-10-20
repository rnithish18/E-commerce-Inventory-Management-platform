import 'dotenv/config';
import app from './app';
import { pool } from './db/pool';
import { startReservationExpiryWorker } from './workers/reservationExpiry';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`🚀 ShopNest API running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    startReservationExpiryWorker();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
}

start();
