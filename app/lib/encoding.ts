import LZString from 'lz-string';

/**
 * Resolve the source code from query params.
 *
 * - `lz`   : lz-string compressed (compressToEncodedURIComponent). Preferred for
 *            long code because it stays URL-safe and compact.
 * - `code` : raw, URL-encoded code (fine for short snippets).
 *
 * `lz` takes precedence when present and decodable.
 */
export function decodeCode(params: URLSearchParams): string {
  const lz = params.get('lz');
  if (lz) {
    const decoded = LZString.decompressFromEncodedURIComponent(lz);
    if (decoded) return decoded;
  }
  return params.get('code') ?? '';
}

/** Compress code for use in a URL (`?lz=...`). Mirrors {@link decodeCode}. */
export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}
