import { describe, it, expect } from 'vitest';
import { safeDate } from '../../lib/content/blog';

describe('safeDate', () => {
  it('should parse a valid date string', () => {
    const d = safeDate('2023-10-15');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2023);
  });

  it('should handle Date objects', () => {
    const original = new Date('2023-10-15');
    const parsed = safeDate(original);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getTime()).toBe(original.getTime());
  });

  it('should return null for invalid date strings', () => {
    expect(safeDate('not-a-date')).toBeNull();
  });

  it('should return null for falsy values', () => {
    expect(safeDate('')).toBeNull();
    expect(safeDate(undefined)).toBeNull();
    expect(safeDate(null)).toBeNull();
  });
});
