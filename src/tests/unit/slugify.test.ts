import { describe, it, expect } from 'vitest';
import { slugify } from '../../lib/features/toc';

describe('slugify', () => {
  it('should convert text to lowercase with hyphens', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugify('API Reference 2.0')).toBe('api-reference-20');
  });

  it('should collapse multiple hyphens and spaces', () => {
    expect(slugify('Multiple   spaces  -- and hyphens')).toBe(
      'multiple-spaces-and-hyphens',
    );
  });

  it('should trim surrounding spaces', () => {
    expect(slugify('  Trim me  ')).toBe('trim-me');
  });
});
