import crypto from 'crypto';
import { query } from '../../db/query';
import { AppError } from '../../middleware/errorHandler';
import { linkOrCreateUser } from './shared';
import { AuthSessionResult } from './types';

// In-memory test store accessible strictly when NODE_ENV === 'test'
const testOtpStore = new Map<string, string>();

export function getTestLastOtp(phone: string): string | null {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test OTP access is strictly forbidden outside test environment');
  }
  return testOtpStore.get(phone) || null;
}

export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  throw new AppError(400, 'Please enter a valid 10-digit Indian mobile number', 'INVALID_PHONE');
}

export async function sendPhoneOtp(
  rawPhone: string,
  ipAddress?: string
): Promise<{ message: string; resendAfterSeconds: number }> {
  const phone = normalizeIndianPhone(rawPhone);

  // 1. Check rate limit & 30-second resend cooldown
  const activeRes = await query<{ id: string; created_at: Date; resend_available_at: Date }>(
    `SELECT id, created_at, resend_available_at 
     FROM phone_otps 
     WHERE phone = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [phone]
  );

  if (activeRes.rows.length > 0) {
    const last = activeRes.rows[0];
    const now = new Date();
    if (new Date(last.resend_available_at) > now) {
      const waitSec = Math.ceil((new Date(last.resend_available_at).getTime() - now.getTime()) / 1000);
      throw new AppError(429, `Please wait ${waitSec} seconds before requesting another code`, 'OTP_COOLDOWN');
    }
  }

  // 2. Generate secure 6-digit random OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  const resendAvailableAt = new Date(now.getTime() + 30 * 1000); // 30 seconds

  // 3. Save to database
  await query(
    `INSERT INTO phone_otps (phone, otp_hash, attempts, max_attempts, resend_available_at, expires_at, ip_address, created_at)
     VALUES ($1, $2, 0, 5, $3, $4, $5, NOW())`,
    [phone, otpHash, resendAvailableAt, expiresAt, ipAddress || null]
  );

  if (process.env.NODE_ENV === 'test') {
    testOtpStore.set(phone, rawOtp);
  }

  // 4. SMS Gateway Delivery / Dev Console Logger
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);

  if (hasTwilio) {
    // Optional real Twilio dispatch if keys set
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: process.env.TWILIO_PHONE_NUMBER!,
          Body: `Your ShopNest login verification code is ${rawOtp}. Valid for 5 minutes.`,
        }).toString(),
      });
    } catch (err: any) {
      console.error('Twilio SMS Delivery failed:', err.message);
    }
  } else if (hasMsg91) {
    // Optional real MSG91 dispatch
    try {
      await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY!,
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: phone.replace('+', ''),
          otp: rawOtp,
        }),
      });
    } catch (err: any) {
      console.error('MSG91 SMS Delivery failed:', err.message);
    }
  } else {
    // Dev SMS logging clearly labeled in server terminal (never in UI or response)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 [DEV SMS] Verification code for ${phone}: ${rawOtp} (expires in 5m)`);
    }
  }

  return {
    message: 'Verification code sent successfully',
    resendAfterSeconds: 30,
  };
}

export async function verifyPhoneOtp(
  rawPhone: string,
  userOtp: string,
  options: { ip?: string; userAgent?: string; returnUrl?: string } = {}
): Promise<AuthSessionResult> {
  const phone = normalizeIndianPhone(rawPhone);

  if (!userOtp || userOtp.length !== 6 || !/^\d{6}$/.test(userOtp)) {
    throw new AppError(400, 'Invalid 6-digit verification code', 'INVALID_OTP');
  }

  // 1. Fetch latest active unconsumed OTP
  const otpRes = await query<{
    id: string;
    otp_hash: string;
    attempts: number;
    max_attempts: number;
    expires_at: Date;
    consumed_at: Date | null;
  }>(
    `SELECT id, otp_hash, attempts, max_attempts, expires_at, consumed_at
     FROM phone_otps
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  );

  if (otpRes.rows.length === 0) {
    throw new AppError(400, 'No verification code was requested for this number', 'OTP_NOT_FOUND');
  }

  const record = otpRes.rows[0];

  if (record.consumed_at !== null) {
    throw new AppError(400, 'This verification code has already been used', 'OTP_ALREADY_USED');
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new AppError(400, 'Verification code has expired. Please request a new code', 'OTP_EXPIRED');
  }

  if (record.attempts >= record.max_attempts) {
    throw new AppError(429, 'Too many incorrect attempts. Please request a new code', 'MAX_ATTEMPTS_EXCEEDED');
  }

  // 2. Increment attempt count
  await query('UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);

  // 3. Constant-time hash comparison
  const candidateHash = crypto.createHash('sha256').update(userOtp).digest('hex');
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(record.otp_hash, 'hex')
  );

  if (!isMatch) {
    const remaining = record.max_attempts - (record.attempts + 1);
    throw new AppError(
      400,
      remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : 'Too many incorrect attempts. Please request a new code.',
      'INVALID_OTP'
    );
  }

  // 4. Mark consumed
  await query('UPDATE phone_otps SET consumed_at = NOW() WHERE id = $1', [record.id]);

  // 5. Link or create user by verified phone
  return linkOrCreateUser(
    {
      provider: 'phone-otp',
      providerUserId: phone,
      phone,
      phoneVerified: true,
      emailVerified: false,
    },
    options
  );
}
