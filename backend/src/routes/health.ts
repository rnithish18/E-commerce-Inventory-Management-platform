import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();
const startTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  try { await pool.query('SELECT 1'); } catch { dbStatus = 'disconnected'; }
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

export default router;
