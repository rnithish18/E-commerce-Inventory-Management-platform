import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';

describe('Password Reset API Tests', () => {
  let testUserEmail: string;
  let testUserId: string;

  beforeAll(async () => {
    testUserEmail = `reset_test_${Date.now()}@shopnest.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: 'OldPassword@123!',
        full_name: 'Reset Test User',
      });
    expect(regRes.status).toBe(201);
    testUserId = regRes.body.user.id;
  });

  it('forgot-password returns 200 with neutral message for existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUserEmail });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('password reset instructions have been sent');

    // Confirm token was generated in database
    const tokenRes = await query<{ token_hash: string }>(
      'SELECT token_hash FROM password_resets WHERE user_id = $1',
      [testUserId]
    );
    expect(tokenRes.rows.length).toBeGreaterThan(0);
  });

  it('forgot-password returns same neutral message for nonexistent email (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent_user_99999@shopnest.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('password reset instructions have been sent');
  });

  it('resets password with valid token and allows logging in with new password', async () => {
    // Generate known token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [testUserId, tokenHash, expiresAt]
    );

    // Call reset password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'BrandNewPassword@123!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('successfully reset');

    // Try logging in with old password (must fail)
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUserEmail, password: 'OldPassword@123!' });
    expect(oldLogin.status).toBe(401);

    // Try logging in with new password (must succeed)
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUserEmail, password: 'BrandNewPassword@123!' });
    expect(newLogin.status).toBe(200);
  });

  it('rejects reusing the same token with 400 TOKEN_ALREADY_USED', async () => {
    // Attempt with same token again
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
      [testUserId, tokenHash, expiresAt]
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'AnotherPassword@123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_ALREADY_USED');
  });

  it('rejects expired token with 400 TOKEN_EXPIRED', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiredTime = new Date(Date.now() - 1000); // 1 second in the past

    await query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [testUserId, tokenHash, expiredTime]
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'AnotherPassword@123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('rejects tampered or non-existent token with 400 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'completely_bogus_token_12345', newPassword: 'AnotherPassword@123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });
});
