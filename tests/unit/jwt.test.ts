import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../../backend/src/utils/jwt';

describe('JWT utilities', () => {
  const customerPayload = { userId: 'abc-123', email: 'test@test.com', role: 'CUSTOMER' as const };
  const adminPayload = { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' as const };

  it('signs and verifies a customer token', () => {
    const token = signToken(customerPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // valid JWT structure

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(customerPayload.userId);
    expect(decoded.email).toBe(customerPayload.email);
    expect(decoded.role).toBe('CUSTOMER');
  });

  it('signs and verifies an admin token', () => {
    const token = signToken(adminPayload);
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.userId).toBe('admin-1');
  });

  it('throws on tampered token signature', () => {
    const token = signToken(customerPayload);
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws on completely invalid token', () => {
    expect(() => verifyToken('not.a.token')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });

  it('does not include password or sensitive data in payload', () => {
    const token = signToken(customerPayload);
    // JWT payload is base64 — decode and verify no secrets
    const payloadPart = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
    expect(decoded).not.toHaveProperty('password');
    expect(decoded).not.toHaveProperty('password_hash');
    expect(decoded.userId).toBe('abc-123');
  });
});
