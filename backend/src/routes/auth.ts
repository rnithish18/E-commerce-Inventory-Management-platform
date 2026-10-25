import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/query';
import { signToken } from '../utils/jwt';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  is_active: boolean;
  created_at: Date;
}

// POST /api/v1/auth/register
router.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, phone } = req.body as { email: string; password: string; full_name: string; phone?: string };

    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    const result = await query<UserRow>(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER')
       RETURNING id, email, full_name, phone, role, created_at`,
      [id, email, password_hash, full_name, phone || null]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body as { email: string; password: string; rememberMe?: boolean };

    const result = await query<UserRow>(
      'SELECT id, email, password_hash, full_name, phone, role, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError(403, 'Your account has been deactivated', 'ACCOUNT_DISABLED');
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const cookieOptions = {
      ...COOKIE_OPTIONS,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    };

    res.cookie('token', token, cookieOptions);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(ForgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email: string };
    const userRes = await query<{ id: string; email: string }>('SELECT id, email FROM users WHERE email = $1', [email]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const id = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await query(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, user.id, tokenHash, expiresAt]
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
      if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
        console.log(`📧 [Dev Mailer] Password reset link for ${email}: ${resetUrl}`);
      }
    }

    // Always return neutral response to prevent user enumeration
    res.json({
      message: 'If that email address is registered, password reset instructions have been sent.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(ResetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRes = await query<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
      `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (resetRes.rows.length === 0) {
      throw new AppError(400, 'Invalid or expired password reset token', 'INVALID_TOKEN');
    }

    const record = resetRes.rows[0];
    if (record.used_at !== null) {
      throw new AppError(400, 'This password reset token has already been used', 'TOKEN_ALREADY_USED');
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new AppError(400, 'This password reset token has expired', 'TOKEN_EXPIRED');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, record.user_id]);
    await query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [record.id]);

    res.json({
      message: 'Password has been successfully reset. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/providers
router.get('/providers', (_req: Request, res: Response) => {
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_ID.includes('REPLACE'));
  res.json({
    google: hasGoogle,
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<Omit<UserRow, 'password_hash' | 'is_active'>>(
      'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
