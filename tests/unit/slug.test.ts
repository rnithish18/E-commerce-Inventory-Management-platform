import { describe, it, expect } from 'vitest';
import { slugify } from '../../backend/src/utils/slug';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });
  it('lowercases everything', () => {
    expect(slugify('SONY WH-1000XM5')).toBe('sony-wh-1000xm5');
  });
  it("removes apostrophes and special chars (Levi's)", () => {
    expect(slugify("Levi's 511 Jeans!")).toBe('levis-511-jeans');
  });
  it('handles multiple consecutive spaces', () => {
    expect(slugify('Sony   WH 1000XM5')).toBe('sony-wh-1000xm5');
  });
  it('trims leading/trailing whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
  it('handles numbers', () => {
    expect(slugify('iPhone 15 128GB')).toBe('iphone-15-128gb');
  });
  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });
  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});
