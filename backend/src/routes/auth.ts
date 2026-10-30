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
import {
  getEnabledProviders,
  isGoogleConfigured,
  isFacebookConfigured,
  isGitHubConfigured,
  isPhoneOtpConfigured,
  isMagicLinkConfigured,
  COOKIE_OPTIONS,
  sanitizeReturnUrl,
  linkOrCreateUser,
} from '../auth/providers';
import * as googleProvider from '../auth/providers/google';
import * as facebookProvider from '../auth/providers/facebook';
import * as githubProvider from '../auth/providers/github';
import * as phoneOtpProvider from '../auth/providers/phone-otp';
import * as magicLinkProvider from '../auth/providers/magic-link';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  is_active: boolean;
  google_sub?: string | null;
  auth_provider?: string;
  created_at: Date;
}

// POST /api/v1/auth/register
router.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, phone } = req.body as { email: string; password: string; full_name: string; phone?: string };

    const existing = await query<{ id: string }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
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
      'SELECT id, email, password_hash, full_name, phone, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
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
    const userRes = await query<{ id: string; email: string }>('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);

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
  const enabled = getEnabledProviders();
  const providersMap: Record<string, boolean> = {
    google: isGoogleConfigured(),
    facebook: isFacebookConfigured(),
    github: isGitHubConfigured(),
    'phone-otp': isPhoneOtpConfigured(),
    'email-magic-link': isMagicLinkConfigured(),
  };

  res.json({
    google: isGoogleConfigured(),
    providers: providersMap,
    providersList: enabled,
    googleClientId: isGoogleConfigured() ? process.env.GOOGLE_CLIENT_ID : undefined,
  });
});

// ==========================================
// GOOGLE OAUTH & GOOGLE ONE TAP
// ==========================================

// GET /api/v1/auth/google
router.get('/google', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnUrl = sanitizeReturnUrl(req.query.returnUrl as string);

  if (!isGoogleConfigured() && process.env.NODE_ENV !== 'test') {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }

  const { codeVerifier, codeChallenge, state } = googleProvider.generatePkcePair();
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

  res.cookie(
    'oauth_state',
    JSON.stringify({ state, codeVerifier, returnUrl }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    }
  );

  const authUrl = googleProvider.buildGoogleAuthUrl({
    callbackUrl,
    state,
    codeChallenge,
  });

  return res.redirect(authUrl);
});

// GET /api/v1/auth/google/callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const rawCookie = req.cookies?.oauth_state;
    res.clearCookie('oauth_state', { path: '/' });

    if (!rawCookie) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    let parsedCookie: { state: string; codeVerifier: string; returnUrl: string };
    try {
      parsedCookie = typeof rawCookie === 'string' ? JSON.parse(rawCookie) : rawCookie;
    } catch {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    const { state: savedState, codeVerifier, returnUrl } = parsedCookie;
    const targetUrl = sanitizeReturnUrl(returnUrl);

    if (!req.query.state || req.query.state !== savedState) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    if (req.query.error) {
      return res.redirect(`${frontendUrl}/login?error=access_denied`);
    }

    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=missing_code`);
    }

    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

    const profile = await googleProvider.exchangeAndVerifyGoogleCode({
      code,
      codeVerifier,
      callbackUrl,
    });

    if (!profile.emailVerified) {
      return res.redirect(`${frontendUrl}/login?error=email_not_verified`);
    }

    const session = await linkOrCreateUser(profile, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl: targetUrl,
    });

    res.cookie('token', session.token, COOKIE_OPTIONS);
    return res.redirect(`${frontendUrl}${targetUrl}`);
  } catch (err: any) {
    console.error('Google OAuth Callback Error:', err.message);
    if (err.code === 'ADMIN_SOCIAL_BLOCKED') {
      return res.redirect(`${frontendUrl}/login?error=admin_google_blocked`);
    }
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// POST /api/v1/auth/google/credential (Google One Tap / GIS)
router.post('/google/credential', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, returnUrl } = req.body;
    if (!credential) {
      throw new AppError(400, 'Credential is required for Google One Tap', 'MISSING_CREDENTIAL');
    }

    const session = await googleProvider.verifyGoogleOneTapCredential(credential, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl,
    });

    res.cookie('token', session.token, COOKIE_OPTIONS);
    res.json({
      message: 'Successfully authenticated with Google One Tap',
      user: session.user,
      returnUrl: session.returnUrl || '/',
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// FACEBOOK OAUTH
// ==========================================

// GET /api/v1/auth/facebook
router.get('/facebook', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnUrl = sanitizeReturnUrl(req.query.returnUrl as string);

  if (!isFacebookConfigured() && process.env.NODE_ENV !== 'test') {
    return res.redirect(`${frontendUrl}/login?error=facebook_not_configured`);
  }

  const state = crypto.randomBytes(32).toString('hex');
  const callbackUrl =
    process.env.FACEBOOK_CALLBACK_URL ||
    `${req.protocol}://${req.get('host')}/api/v1/auth/facebook/callback`;

  res.cookie(
    'oauth_fb_state',
    JSON.stringify({ state, returnUrl }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    }
  );

  const authUrl = facebookProvider.buildFacebookAuthUrl({ callbackUrl, state });
  return res.redirect(authUrl);
});

// GET /api/v1/auth/facebook/callback
router.get('/facebook/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const rawCookie = req.cookies?.oauth_fb_state;
    res.clearCookie('oauth_fb_state', { path: '/' });

    if (!rawCookie) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    let parsedCookie: { state: string; returnUrl: string };
    try {
      parsedCookie = typeof rawCookie === 'string' ? JSON.parse(rawCookie) : rawCookie;
    } catch {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    const { state: savedState, returnUrl } = parsedCookie;
    const targetUrl = sanitizeReturnUrl(returnUrl);

    if (!req.query.state || req.query.state !== savedState) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    if (req.query.error) {
      return res.redirect(`${frontendUrl}/login?error=access_denied`);
    }

    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=missing_code`);
    }

    const callbackUrl =
      process.env.FACEBOOK_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/api/v1/auth/facebook/callback`;

    const profile = await facebookProvider.exchangeAndVerifyFacebookCode({
      code,
      callbackUrl,
    });

    if (!profile.email || !profile.emailVerified) {
      return res.redirect(`${frontendUrl}/login?error=email_not_verified`);
    }

    const session = await linkOrCreateUser(profile, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl: targetUrl,
    });

    res.cookie('token', session.token, COOKIE_OPTIONS);
    return res.redirect(`${frontendUrl}${targetUrl}`);
  } catch (err: any) {
    if (err.code === 'ADMIN_SOCIAL_BLOCKED') {
      return res.redirect(`${frontendUrl}/login?error=admin_social_blocked`);
    }
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// ==========================================
// GITHUB OAUTH
// ==========================================

// GET /api/v1/auth/github
router.get('/github', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnUrl = sanitizeReturnUrl(req.query.returnUrl as string);

  if (!isGitHubConfigured() && process.env.NODE_ENV !== 'test') {
    return res.redirect(`${frontendUrl}/login?error=github_not_configured`);
  }

  const state = crypto.randomBytes(32).toString('hex');
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`;

  res.cookie(
    'oauth_gh_state',
    JSON.stringify({ state, returnUrl }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    }
  );

  const authUrl = githubProvider.buildGithubAuthUrl({ callbackUrl, state });
  return res.redirect(authUrl);
});

// GET /api/v1/auth/github/callback
router.get('/github/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const rawCookie = req.cookies?.oauth_gh_state;
    res.clearCookie('oauth_gh_state', { path: '/' });

    if (!rawCookie) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    let parsedCookie: { state: string; returnUrl: string };
    try {
      parsedCookie = typeof rawCookie === 'string' ? JSON.parse(rawCookie) : rawCookie;
    } catch {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    const { state: savedState, returnUrl } = parsedCookie;
    const targetUrl = sanitizeReturnUrl(returnUrl);

    if (!req.query.state || req.query.state !== savedState) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    if (req.query.error) {
      return res.redirect(`${frontendUrl}/login?error=access_denied`);
    }

    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=missing_code`);
    }

    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`;

    const profile = await githubProvider.exchangeAndVerifyGithubCode({
      code,
      callbackUrl,
    });

    if (!profile.emailVerified || !profile.email) {
      return res.redirect(`${frontendUrl}/login?error=email_not_verified`);
    }

    const session = await linkOrCreateUser(profile, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl: targetUrl,
    });

    res.cookie('token', session.token, COOKIE_OPTIONS);
    return res.redirect(`${frontendUrl}${targetUrl}`);
  } catch (err: any) {
    if (err.code === 'ADMIN_SOCIAL_BLOCKED') {
      return res.redirect(`${frontendUrl}/login?error=admin_social_blocked`);
    }
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// ==========================================
// PHONE OTP AUTH
// ==========================================

// POST /api/v1/auth/phone/send-otp
router.post('/phone/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      throw new AppError(400, 'Mobile phone number is required', 'MISSING_PHONE');
    }

    const result = await phoneOtpProvider.sendPhoneOtp(phone, req.ip);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/phone/verify-otp
router.post('/phone/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp, returnUrl } = req.body;
    if (!phone || !otp) {
      throw new AppError(400, 'Phone and verification code are required', 'MISSING_FIELDS');
    }

    const session = await phoneOtpProvider.verifyPhoneOtp(phone, otp, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl,
    });

    res.cookie('token', session.token, COOKIE_OPTIONS);
    res.json({
      message: 'Mobile number verified successfully',
      user: session.user,
      returnUrl: session.returnUrl || '/',
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// EMAIL MAGIC LINK AUTH
// ==========================================

// POST /api/v1/auth/magic-link/send
router.post('/magic-link/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, returnUrl } = req.body;
    if (!email) {
      throw new AppError(400, 'Email address is required', 'MISSING_EMAIL');
    }

    const result = await magicLinkProvider.sendMagicLink(email, {
      ip: req.ip,
      returnUrl,
    });

    res.cookie('magic_link_bind', result.cookieBindingSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/magic-link/verify
router.post('/magic-link/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, returnUrl } = req.body;
    const cookieSecret = req.cookies?.magic_link_bind;

    if (!token) {
      throw new AppError(400, 'Sign-in token is required', 'MISSING_TOKEN');
    }

    if (!cookieSecret) {
      throw new AppError(403, 'Sign-in link must be opened in the same browser where it was requested', 'BROWSER_BINDING_MISMATCH');
    }

    const session = await magicLinkProvider.verifyMagicLink(token, cookieSecret, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      returnUrl,
    });

    res.clearCookie('magic_link_bind', { path: '/' });
    res.cookie('token', session.token, COOKIE_OPTIONS);

    res.json({
      message: 'Authenticated successfully with magic link',
      user: session.user,
      returnUrl: session.returnUrl || '/',
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// CUSTOMER PROFILE: LOGIN METHODS & PASSWORD
// ==========================================

// GET /api/v1/auth/identities
router.get('/identities', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const userRes = await query<{ password_hash: string | null; email: string; phone: string | null; phone_verified: boolean }>(
      'SELECT password_hash, email, phone, phone_verified FROM users WHERE id = $1',
      [userId]
    );

    const user = userRes.rows[0];
    const identitiesRes = await query<{ id: string; provider: string; provider_user_id: string; email: string | null; created_at: Date }>(
      'SELECT id, provider, provider_user_id, email, created_at FROM user_identities WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );

    res.json({
      hasPassword: Boolean(user?.password_hash),
      email: user?.email,
      phone: user?.phone,
      phoneVerified: Boolean(user?.phone_verified),
      identities: identitiesRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/identities/:provider/disconnect
router.post('/identities/:provider/disconnect', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { provider } = req.params;

    const userRes = await query<{ password_hash: string | null }>('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const hasPassword = Boolean(userRes.rows[0]?.password_hash);

    const identitiesRes = await query<{ id: string; provider: string }>(
      'SELECT id, provider FROM user_identities WHERE user_id = $1',
      [userId]
    );

    const identities = identitiesRes.rows;
    const toRemove = identities.find((i) => i.provider === provider);

    if (!toRemove) {
      throw new AppError(404, 'Login provider not linked to this account', 'NOT_FOUND');
    }

    // Safety rule: Cannot disconnect last remaining way to sign in!
    if (!hasPassword && identities.length <= 1) {
      throw new AppError(
        400,
        'Cannot disconnect your only sign-in method. Please set a password first.',
        'CANNOT_DISCONNECT_LAST_METHOD'
      );
    }

    await query('DELETE FROM user_identities WHERE id = $1', [toRemove.id]);

    // Audit log
    await query(
      `INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, new_values)
       VALUES (gen_random_uuid(), $1, 'IDENTITY_DISCONNECTED', 'user', $1, $2)`,
      [userId, JSON.stringify({ provider })]
    );

    res.json({ message: `${provider} login method disconnected successfully` });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/set-password
router.post('/set-password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long', 'INVALID_PASSWORD');
    }

    const password_hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, req.user!.userId]);

    res.json({ message: 'Password set successfully. You can now also log in using email and password.' });
  } catch (err) {
    next(err);
  }
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
