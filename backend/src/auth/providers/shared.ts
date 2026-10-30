import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/query';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { NormalizedProfile, AuthSessionResult } from './types';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export function sanitizeReturnUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '/';
  const trimmed = url.trim();
  // Must start with a single slash, not double slash, no backslashes, no scheme
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\') || trimmed.includes('://')) {
    return '/';
  }
  return trimmed;
}

interface UserDbRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  phone: string | null;
  phone_verified?: boolean;
  role: 'CUSTOMER' | 'ADMIN';
  is_active: boolean;
  google_sub?: string | null;
  created_at: Date;
}

export async function linkOrCreateUser(
  profile: NormalizedProfile,
  options: { ip?: string; userAgent?: string; returnUrl?: string } = {}
): Promise<AuthSessionResult> {
  // 1. Check if identity already exists in user_identities
  const identityRes = await query<{ user_id: string }>(
    `SELECT user_id FROM user_identities WHERE provider = $1 AND provider_user_id = $2`,
    [profile.provider, profile.providerUserId]
  );

  let targetUserId: string | null = identityRes.rows[0]?.user_id || null;
  let isNewUser = false;

  // Fallback check on users.google_sub if google provider for backward compatibility
  if (!targetUserId && profile.provider === 'google') {
    const legacyGoogle = await query<{ id: string }>(
      `SELECT id FROM users WHERE google_sub = $1`,
      [profile.providerUserId]
    );
    if (legacyGoogle.rows[0]) {
      targetUserId = legacyGoogle.rows[0].id;
      // Backfill into user_identities
      await query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [targetUserId, profile.provider, profile.providerUserId, profile.email || null, profile.emailVerified]
      );
    }
  }

  // 2. If identity not found, try linking to existing user via verified email
  if (!targetUserId && profile.email) {
    if (!profile.emailVerified) {
      throw new AppError(400, 'Cannot link account: email is not verified by provider', 'EMAIL_NOT_VERIFIED');
    }

    const emailRes = await query<UserDbRow>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [profile.email]
    );

    if (emailRes.rows[0]) {
      const existingUser = emailRes.rows[0];

      // CRITICAL SECURITY RULE: Social/OTP/Magic-link logins must NEVER sign in to or link an ADMIN
      if (existingUser.role === 'ADMIN') {
        throw new AppError(403, 'Administrator accounts cannot be accessed via social or passwordless login', 'ADMIN_SOCIAL_BLOCKED');
      }

      targetUserId = existingUser.id;

      // Link new identity to this user
      await query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [targetUserId, profile.provider, profile.providerUserId, profile.email, profile.emailVerified]
      );

      // Audit log the link
      await query(
        `INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
         VALUES (gen_random_uuid(), $1, 'IDENTITY_LINKED', 'user', $1, NULL, $2, $3)`,
        [targetUserId, JSON.stringify({ provider: profile.provider, providerUserId: profile.providerUserId }), options.ip || null]
      );
    }
  }

  // 3. If identity not found and profile is phone-based, try linking to verified phone
  if (!targetUserId && profile.phone && profile.phoneVerified) {
    const phoneRes = await query<UserDbRow>(
      `SELECT * FROM users WHERE phone = $1 AND phone_verified = true`,
      [profile.phone]
    );

    if (phoneRes.rows[0]) {
      const existingUser = phoneRes.rows[0];
      if (existingUser.role === 'ADMIN') {
        throw new AppError(403, 'Administrator accounts cannot be accessed via social or passwordless login', 'ADMIN_SOCIAL_BLOCKED');
      }

      targetUserId = existingUser.id;

      await query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [targetUserId, profile.provider, profile.providerUserId, profile.email || null, profile.emailVerified]
      );
    }
  }

  // 4. If still no user, create a brand-new CUSTOMER account
  if (!targetUserId) {
    const newUserId = uuidv4();
    // Use provided email or generate synthetic placeholder for phone-only users
    const userEmail = profile.email
      ? profile.email.toLowerCase()
      : `phone_${profile.phone?.replace(/\D/g, '') || uuidv4().slice(0, 8)}@phone.shopnest.local`;

    const userFullName = profile.fullName || (profile.email ? profile.email.split('@')[0] : 'ShopNest Customer');

    const insertUserRes = await query<UserDbRow>(
      `INSERT INTO users (id, email, full_name, phone, phone_verified, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', true, NOW(), NOW())
       RETURNING *`,
      [
        newUserId,
        userEmail,
        userFullName,
        profile.phone || null,
        Boolean(profile.phoneVerified),
      ]
    );

    targetUserId = insertUserRes.rows[0].id;
    isNewUser = true;

    // Attach identity
    await query(
      `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) DO NOTHING`,
      [targetUserId, profile.provider, profile.providerUserId, profile.email || null, profile.emailVerified]
    );

    // Sync google_sub for legacy compatibility
    if (profile.provider === 'google') {
      await query('UPDATE users SET google_sub = $1, auth_provider = $2 WHERE id = $3', [profile.providerUserId, 'google', targetUserId]);
    }

    // Audit log registration
    await query(
      `INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES (gen_random_uuid(), $1, 'USER_REGISTERED_SOCIAL', 'user', $1, NULL, $2, $3)`,
      [targetUserId, JSON.stringify({ provider: profile.provider, providerUserId: profile.providerUserId }), options.ip || null]
    );
  }

  // 5. Fetch full user record to confirm active state and security rules
  const userRes = await query<UserDbRow>(
    `SELECT id, email, full_name, phone, role, is_active FROM users WHERE id = $1`,
    [targetUserId]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw new AppError(404, 'User account not found', 'NOT_FOUND');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(403, 'Administrator accounts cannot be accessed via social or passwordless login', 'ADMIN_SOCIAL_BLOCKED');
  }

  if (!user.is_active) {
    throw new AppError(403, 'Your account has been deactivated', 'ACCOUNT_DISABLED');
  }

  // Update identity last updated timestamp
  await query(
    `UPDATE user_identities SET updated_at = NOW() WHERE provider = $1 AND provider_user_id = $2`,
    [profile.provider, profile.providerUserId]
  );

  // Audit login
  await query(
    `INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
     VALUES (gen_random_uuid(), $1, 'USER_LOGIN', 'user', $1, NULL, $2, $3)`,
    [user.id, JSON.stringify({ provider: profile.provider, method: profile.provider }), options.ip || null]
  );

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    },
    token,
    returnUrl: sanitizeReturnUrl(options.returnUrl),
    isNewUser,
  };
}
