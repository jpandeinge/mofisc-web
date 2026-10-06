export const DEFAULT_AUTH_REDIRECT = '/app';

/**
 * Only allow same-origin application paths after authentication.
 * OAuth redirects are attacker-controlled input, so absolute URLs,
 * protocol-relative URLs, and backslash variants must fall back safely.
 */
export const sanitizeAuthRedirect = (
  value: string | null | undefined,
  fallback: string = DEFAULT_AUTH_REDIRECT
): string => {
  const safeFallback =
    fallback.startsWith('/') && !fallback.startsWith('//') && !fallback.includes('\\')
      ? fallback
      : DEFAULT_AUTH_REDIRECT;

  if (!value) return safeFallback;

  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return safeFallback;
  }

  try {
    const base = new URL('https://mofisc.local');
    const resolved = new URL(candidate, base);

    if (resolved.origin !== base.origin) {
      return safeFallback;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return safeFallback;
  }
};
