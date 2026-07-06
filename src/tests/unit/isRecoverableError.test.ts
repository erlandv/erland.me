import { describe, it, expect } from 'vitest';
import { isRecoverableError } from '../../lib/infrastructure/error-boundary';

describe('isRecoverableError', () => {
  it('should identify network errors as recoverable', () => {
    expect(isRecoverableError(new Error('Network error occurred'))).toBe(true);
    expect(isRecoverableError(new Error('Fetch timeout'))).toBe(true);
  });

  it('should identify chunk loading errors as recoverable', () => {
    expect(isRecoverableError(new Error('loading chunk 123 failed'))).toBe(
      true,
    );
    expect(
      isRecoverableError(
        new Error('Failed to fetch dynamically imported module'),
      ),
    ).toBe(true);
  });

  it('should identify unknown errors as not recoverable', () => {
    expect(
      isRecoverableError(
        new Error('TypeError: cannot read properties of undefined'),
      ),
    ).toBe(false);
    expect(isRecoverableError(new Error('SyntaxError'))).toBe(false);
  });
});
