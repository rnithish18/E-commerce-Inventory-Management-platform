import crypto from 'crypto';
import { query } from '../../db/query';
import { AppError } from '../../middleware/errorHandler';
import { linkOrCreateUser } from './shared';
import { AuthSessionResult } from './types';
import { sendMail } from '../../services/mailer';

// In-memory test store accessible strictly when NODE_ENV === 'test'
const testMagicLinkStore = new Map<string, string>();

export function getTestLastMagicLink(email: string): string | null {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test magic link access is strictly forbidden outside test environment');
  }
  return testMagicLinkStore.get(email.toLowerCase()) || null;
}

export async function sendMagicLink(
  rawEmail: string,
  options: { ip?: string; returnUrl?: string } = {}
): Promise<{ message: string; cookieBindingSecret: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    throw new AppError(400, 'Please enter a valid email address', 'INVALID_EMAIL');
  }

  // 1. Generate token and browser binding secret
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const cookieBindingSecret = crypto.randomBytes(32).toString('hex');
  const cookieBindingHash = crypto.createHash('sha256').update(cookieBindingSecret).digest('hex');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

  // 2. Persist magic link
  await query(
    `INSERT INTO magic_links (email, token_hash, cookie_binding_hash, expires_at, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [email, tokenHash, cookieBindingHash, expiresAt, options.ip || null]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const returnParam = options.returnUrl ? `&returnUrl=${encodeURIComponent(options.returnUrl)}` : '';
  const magicLinkUrl = `${frontendUrl}/auth/magic-link?token=${rawToken}${returnParam}`;

  if (process.env.NODE_ENV === 'test') {
    testMagicLinkStore.set(email, rawToken);
  }

  // 3. Send email via mailer
  await sendMail({
    to: email,
    subject: 'Your ShopNest One-Click Sign-in Link',
    text: `Hello,\n\nClick the link below to sign in to your ShopNest account:\n${magicLinkUrl}\n\nThis link expires in 15 minutes and can only be used once from the browser you requested it from.\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">Sign in to ShopNest</h2>
        <p>Click the button below to sign in directly. No password required.</p>
        <p style="margin: 24px 0;">
          <a href="${magicLinkUrl}" style="background-color: #f97316; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Sign in to ShopNest
          </a>
        </p>
        <p style="color: #64748b; font-size: 12px;">This link expires in 15 minutes and works only in the browser where it was requested.</p>
      </div>
    `,
  });

  return {
    message: 'We have sent a sign-in link to your email address.',
    cookieBindingSecret,
  };
}

export async function verifyMagicLink(
  token: string,
  cookieBindingSecret: string,
  options: { ip?: string; userAgent?: string; returnUrl?: string } = {}
): Promise<AuthSessionResult> {
  if (!token || !cookieBindingSecret) {
    throw new AppError(400, 'Invalid or missing sign-in token or browser binding', 'INVALID_MAGIC_LINK');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const cookieBindingHash = crypto.createHash('sha256').update(cookieBindingSecret).digest('hex');

  // 1. Find matching magic link
  const linkRes = await query<{
    id: string;
    email: string;
    cookie_binding_hash: string;
    expires_at: Date;
    consumed_at: Date | null;
  }>(
    `SELECT id, email, cookie_binding_hash, expires_at, consumed_at
     FROM magic_links
     WHERE token_hash = $1`,
    [tokenHash]
  );

  if (linkRes.rows.length === 0) {
    throw new AppError(400, 'This sign-in link is invalid or has expired', 'INVALID_MAGIC_LINK');
  }

  const record = linkRes.rows[0];

  if (record.consumed_at !== null) {
    throw new AppError(400, 'This sign-in link has already been used', 'MAGIC_LINK_ALREADY_USED');
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new AppError(400, 'This sign-in link has expired. Please request a new one', 'MAGIC_LINK_EXPIRED');
  }

  // 2. Validate browser cookie binding (prevents opening on different browser)
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(cookieBindingHash, 'hex'),
    Buffer.from(record.cookie_binding_hash, 'hex')
  );

  if (!isMatch) {
    throw new AppError(403, 'Sign-in link must be opened in the same browser where it was requested', 'BROWSER_BINDING_MISMATCH');
  }

  // 3. Mark consumed
  await query('UPDATE magic_links SET consumed_at = NOW() WHERE id = $1', [record.id]);

  // 4. Link or create user by verified email
  return linkOrCreateUser(
    {
      provider: 'email-magic-link',
      providerUserId: record.email,
      email: record.email,
      emailVerified: true,
    },
    options
  );
}
