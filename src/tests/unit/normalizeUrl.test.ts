import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../../lib/infrastructure/router-events';

describe('normalizeUrl', () => {
  it('should return window.location.href if input is falsy', () => {
    // We mock window object here
    globalThis.window = {
      location: { href: 'http://localhost/test' },
    } as unknown as Window & typeof globalThis;
    expect(normalizeUrl(null)).toBe('http://localhost/test');
    expect(normalizeUrl(undefined)).toBe('http://localhost/test');
  });

  it('should return the string itself if input is a string', () => {
    expect(normalizeUrl('/about-us')).toBe('/about-us');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should call toString on URL objects', () => {
    const url = new URL('https://erland.me/blog');
    expect(normalizeUrl(url)).toBe('https://erland.me/blog');
  });
});
