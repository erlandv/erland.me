import { describe, it, expect } from 'vitest';
import { pickExcerpt } from '../../../scripts/generate-search-index.mjs';

describe('pickExcerpt', () => {
  it('should prioritize excerpt from data', () => {
    const data = {
      excerpt: 'This is the excerpt.',
      description: 'This is description.',
    };
    const plainText = 'Some body text';
    expect(pickExcerpt(data, plainText)).toBe('This is the excerpt.');
  });

  it('should fallback to description if excerpt is empty or not string', () => {
    const data = { description: 'This is description.' };
    const plainText = 'Some body text';
    expect(pickExcerpt(data, plainText)).toBe('This is description.');
  });

  it('should fallback to summarized body if both excerpt and description are missing', () => {
    const data = {};
    const plainText = 'This is the body text that should be summarized.';
    expect(pickExcerpt(data, plainText)).toBe(
      'This is the body text that should be summarized.',
    );
  });

  it('should trim returned text', () => {
    const data = { excerpt: '  Trimmed excerpt  ' };
    expect(pickExcerpt(data, '')).toBe('Trimmed excerpt');
  });
});
