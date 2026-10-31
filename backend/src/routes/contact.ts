import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/v1/contact - Public contact inquiries storing into contact_messages
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError(400, 'Your full name is required', 'VALIDATION_ERROR');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new AppError(400, 'A valid email address is required', 'VALIDATION_ERROR');
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new AppError(400, 'Subject is required', 'VALIDATION_ERROR');
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError(400, 'Message body is required', 'VALIDATION_ERROR');
    }

    const id = uuidv4();
    await query(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'NEW', NOW())`,
      [id, name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    res.json({
      success: true,
      message: 'Your message has been received by our support team. We will review and respond shortly.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
