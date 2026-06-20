import LZString from 'lz-string';

/**
 * Upper bound on the compressed `lz` payload we'll decompress. Caps the work and
 * transient memory of decompression before `config.ts` truncates the result to
 * `maxCodeLength`, so a tiny URL can't expand into a multi-MB allocation.
 */
const MAX_LZ_LENGTH = 64 * 1024;

/**
 * Resolve the source code from query params.
 *
 * - `lz`   : lz-string compressed (compressToEncodedURIComponent). Preferred for
 *            long code because it stays URL-safe and compact.
 * - `code` : raw, URL-encoded code (fine for short snippets).
 *
 * `lz` takes precedence when present, within the size bound, and decodable.
 */
export function decodeCode(params: URLSearchParams): string {
  const lz = params.get('lz');
  if (lz && lz.length <= MAX_LZ_LENGTH) {
    const decoded = LZString.decompressFromEncodedURIComponent(lz);
    if (decoded) return decoded;
  }
  return params.get('code') ?? '';
}

/** Compress code for use in a URL (`?lz=...`). Mirrors {@link decodeCode}. */
export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}
