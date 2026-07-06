import { describe, it, expect } from 'vitest';
import { slugifyCategory } from '../../lib/content/blog';

describe('slugifyCategory', () => {
  it('should convert standard text to slug', () => {
    expect(slugifyCategory('Web Development')).toBe('web-development');
  });

  it('should replace ampersand with and', () => {
    expect(slugifyCategory('AI & ML')).toBe('ai-and-ml');
  });

  it('should remove diacritics', () => {
    expect(slugifyCategory('Café Tutorials')).toBe('cafe-tutorials');
  });

  it('should trim and handle multiple spaces', () => {
    expect(slugifyCategory('  Hello   World  ')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugifyCategory('C++ & C# Programming!')).toBe(
      'c-and-c-programming',
    );
  });

  it('should return empty string for falsy input', () => {
    expect(slugifyCategory('')).toBe('');
    expect(slugifyCategory(undefined as any)).toBe('');
    expect(slugifyCategory(null as any)).toBe('');
  });
});
