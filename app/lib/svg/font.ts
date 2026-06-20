import fs from 'node:fs';
import path from 'node:path';

export const FONT_FAMILY = 'UDEV Gothic';
/** Advance width of one half-width glyph as a fraction of font-size. UDEV Gothic
 *  renders half-width glyphs at 0.5em and full-width CJK glyphs at exactly 2×
 *  (1.0em), so a wide character counted as 2 columns lines up with `2*charWidth`. */
export const CHAR_ADVANCE = 0.5;

/**
 * System CJK font fallbacks, tried after our embedded face. The SVG embeds only
 * a Latin/box-drawing subset (a full CJK face is multiple MB — too large to
 * inline), so CJK code points fall through to the viewer's OS font. The grid
 * still lines up: a standard CJK font is full-width = 1em = 2 columns.
 */
const CJK_FALLBACK =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',YuGothic,Meiryo," +
  "'Noto Sans CJK JP','Noto Sans JP','Microsoft YaHei'";

/** Font stack shared by the SVG `@font-face` rule and every `<text>` element. */
export const FONT_STACK =
  `'${FONT_FAMILY}',ui-monospace,SFMono-Regular,Menlo,Consolas,${CJK_FALLBACK},monospace`;

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const REGULAR = path.join(FONT_DIR, 'UDEVGothic-Regular.ttf');
const BOLD = path.join(FONT_DIR, 'UDEVGothic-Bold.ttf');
/** Latin/box-drawing-only subset embedded into standalone SVGs (small enough to
 *  inline; CJK relies on the viewer's system font via {@link CJK_FALLBACK}). */
const SVG_SUBSET = path.join(FONT_DIR, 'UDEVGothic-Regular-Latin.ttf');

let subsetDataUrl: string | null = null;

/** base64 `data:` URL of the embeddable Latin subset, cached after first read. */
export function regularFontDataUrl(): string {
  if (subsetDataUrl == null) {
    const b64 = fs.readFileSync(SVG_SUBSET).toString('base64');
    subsetDataUrl = `data:font/ttf;base64,${b64}`;
  }
  return subsetDataUrl;
}

/** Absolute paths to the full font files (used by the GIF rasterizer via resvg,
 *  which has no SVG-size limit and so loads the complete CJK-capable faces). */
export const fontFiles = { regular: REGULAR, bold: BOLD };

/**
 * `@font-face` + base-style block to inline into a standalone SVG so the Latin
 * glyphs render identically across GitHub, browsers and slide tools. Bold is
 * synthesized by the renderer from the regular face (keeps the SVG small).
 */
export function fontStyleBlock(fontSize: number): string {
  return (
    `@font-face{font-family:'${FONT_FAMILY}';font-style:normal;font-weight:400;` +
    `src:url(${regularFontDataUrl()}) format('truetype');}` +
    `text{font-family:${FONT_STACK};font-size:${fontSize}px;}`
  );
}
