/**
 * East-Asian-width-aware column math.
 *
 * The whole renderer lays text out on a fixed monospace grid where every
 * x-coordinate is `contentX + col * charWidth`. A full-width CJK glyph occupies
 * two of those columns, so column counting must be display-width aware — not a
 * plain code-point count. The bundled font (UDEV Gothic) renders half-width
 * glyphs at exactly 0.5em and full-width glyphs at exactly 1.0em, so a wide
 * character measured as 2 columns lines up pixel-exactly with `2 * charWidth`.
 *
 * Ranges below follow the Unicode East Asian Width property (Wide `W` +
 * Fullwidth `F`). Combining marks and zero-width controls count as 0 columns so
 * they don't desync the grid or the typing cursor. Emoji are intentionally left
 * at width 1 (color emoji aren't rendered by the rasterizer anyway).
 */

// Sorted, non-overlapping [lo, hi] inclusive code-point ranges (binary search).
// East Asian Wide + Fullwidth → 2 columns.
const WIDE: ReadonlyArray<readonly [number, number]> = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK Radicals, Kangxi, CJK Symbols & Punctuation (incl. U+3000)
  [0x3041, 0x33ff], // Hiragana, Katakana, Bopomofo, Hangul Compat Jamo, Kanbun, Enclosed/Compat CJK
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xa000, 0xa4cf], // Yi Syllables / Radicals
  [0xa960, 0xa97f], // Hangul Jamo Extended-A
  [0xac00, 0xd7a3], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe10, 0xfe19], // Vertical Forms
  [0xfe30, 0xfe6f], // CJK Compatibility Forms, Small Form Variants
  [0xff00, 0xff60], // Fullwidth Forms (fullwidth ASCII & punctuation)
  [0xffe0, 0xffe6], // Fullwidth signs (￥ etc.)
  [0x1b000, 0x1b16f], // Kana Supplement / Extended-A / Small Kana Extension
  [0x1f200, 0x1f2ff], // Enclosed Ideographic Supplement
  [0x20000, 0x2fffd], // CJK Unified Ideographs Extension B–F
  [0x30000, 0x3fffd], // CJK Unified Ideographs Extension G+
];

// Combining marks & zero-width controls → 0 columns.
const ZERO: ReadonlyArray<readonly [number, number]> = [
  [0x0300, 0x036f], // Combining Diacritical Marks
  [0x1ab0, 0x1aff], // Combining Diacritical Marks Extended
  [0x1dc0, 0x1dff], // Combining Diacritical Marks Supplement
  [0x200b, 0x200f], // ZWSP, ZWNJ, ZWJ, LRM, RLM
  [0x202a, 0x202e], // Bidi embedding/override controls
  [0x2060, 0x2064], // Word Joiner & invisible operators
  [0x20d0, 0x20ff], // Combining Diacritical Marks for Symbols
  [0xfe00, 0xfe0f], // Variation Selectors
  [0xfe20, 0xfe2f], // Combining Half Marks
  [0xfeff, 0xfeff], // Zero Width No-Break Space (BOM)
  [0xe0100, 0xe01ef], // Variation Selectors Supplement
];

/** True if `cp` falls within one of the sorted [lo, hi] ranges. */
function inRanges(cp: number, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end] = ranges[mid];
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return true;
  }
  return false;
}

/** Display columns occupied by a single code point: 0, 1, or 2. */
export function charCols(cp: number): number {
  if (inRanges(cp, ZERO)) return 0;
  if (inRanges(cp, WIDE)) return 2;
  return 1;
}

/** Total display columns of a string, summed over its code points. */
export function strCols(s: string): number {
  let n = 0;
  for (const ch of s) n += charCols(ch.codePointAt(0)!);
  return n;
}

/**
 * Slice `s` to at most `maxCols` display columns, never splitting a wide
 * character (a 2-column glyph that wouldn't fully fit is dropped, leaving the
 * column budget rounded down). Returns the kept text and its actual column count.
 */
export function sliceToCols(s: string, maxCols: number): { text: string; cols: number } {
  if (maxCols <= 0) return { text: '', cols: 0 };
  let cols = 0;
  let out = '';
  for (const ch of s) {
    const w = charCols(ch.codePointAt(0)!);
    if (cols + w > maxCols) break;
    out += ch;
    cols += w;
  }
  return { text: out, cols };
}
