import { describe, it, expect } from 'vitest';
import { formatPaise, rupeesToPaise, paiseToRupees, calculateDiscountPercent, calculateTax, calculateShipping } from '../../backend/src/utils/money';

describe('Money utilities', () => {
  describe('formatPaise', () => {
    it('formats 29900 paise correctly', () => {
      expect(formatPaise(29900)).toContain('299');
    });
    it('formats 299900 paise with comma separator', () => {
      expect(formatPaise(299900)).toContain('2,999');
    });
    it('formats 0 paise as ₹0', () => {
      expect(formatPaise(0)).toContain('0');
    });
    it('throws on non-integer value', () => {
      expect(() => formatPaise(29.5)).toThrow();
    });
    it('throws on float value', () => {
      expect(() => formatPaise(1.99)).toThrow();
    });
    it('includes ₹ symbol', () => {
      expect(formatPaise(10000)).toContain('₹');
    });
  });

  describe('rupeesToPaise', () => {
    it('converts 299 rupees to 29900 paise', () => {
      expect(rupeesToPaise(299)).toBe(29900);
    });
    it('converts 0.01 rupees to 1 paise', () => {
      expect(rupeesToPaise(0.01)).toBe(1);
    });
    it('handles zero', () => {
      expect(rupeesToPaise(0)).toBe(0);
    });
    it('rounds correctly for floating point imprecision', () => {
      expect(rupeesToPaise(0.005)).toBe(1); // rounds up 0.5
    });
  });

  describe('paiseToRupees', () => {
    it('converts 29900 paise to 299 rupees', () => {
      expect(paiseToRupees(29900)).toBe(299);
    });
    it('converts 1 paise to 0.01 rupees', () => {
      expect(paiseToRupees(1)).toBeCloseTo(0.01);
    });
  });

  describe('calculateDiscountPercent', () => {
    it('calculates 50% discount correctly', () => {
      expect(calculateDiscountPercent(500, 1000)).toBe(50);
    });
    it('calculates 40% off correctly', () => {
      expect(calculateDiscountPercent(299900, 499900)).toBe(40);
    });
    it('returns 0 when price equals MRP', () => {
      expect(calculateDiscountPercent(1000, 1000)).toBe(0);
    });
    it('returns 0 when price > MRP', () => {
      expect(calculateDiscountPercent(1200, 1000)).toBe(0);
    });
    it('returns 0 when MRP is 0', () => {
      expect(calculateDiscountPercent(0, 0)).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('calculates 18% GST correctly', () => {
      expect(calculateTax(10000)).toBe(1800);
    });
    it('uses integer arithmetic — no float errors', () => {
      const tax = calculateTax(9999);
      expect(Number.isInteger(tax)).toBe(true);
    });
    it('accepts custom tax rate', () => {
      expect(calculateTax(10000, 5)).toBe(500);
    });
  });

  describe('calculateShipping', () => {
    it('charges 5000 paise (₹50) for orders under ₹500', () => {
      expect(calculateShipping(49900)).toBe(5000);
    });
    it('is free for orders >= ₹500 (50000 paise)', () => {
      expect(calculateShipping(50000)).toBe(0);
    });
    it('is free for large orders', () => {
      expect(calculateShipping(200000)).toBe(0);
    });
    it('charges shipping for zero-value cart', () => {
      expect(calculateShipping(0)).toBe(5000);
    });
  });
});
