import { DEFAULT_AUTH_REDIRECT, sanitizeAuthRedirect } from './authRedirect';

describe('sanitizeAuthRedirect', () => {
  it.each([
    ['/planning', '/planning'],
    ['/activity?page=2', '/activity?page=2'],
    ['/settings/general#security', '/settings/general#security'],
  ])('keeps safe application path %s', (input, expected) => {
    expect(sanitizeAuthRedirect(input)).toBe(expected);
  });

  it.each([
    'https://example.com/phishing',
    '//example.com/phishing',
    '/\\example.com/phishing',
    'javascript:alert(1)',
    '   ',
  ])('rejects unsafe redirect %s', (input) => {
    expect(sanitizeAuthRedirect(input)).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it('uses a caller-provided safe fallback', () => {
    expect(sanitizeAuthRedirect('//example.com', '/profile')).toBe('/profile');
  });
});
