import fs from 'node:fs';
import path from 'node:path';

export const FONT_FAMILY = 'JetBrains Mono';
/** Advance width of one glyph as a fraction of font-size (JetBrains Mono = 0.6em). */
export const CHAR_ADVANCE = 0.6;

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const REGULAR = path.join(FONT_DIR, 'JetBrainsMono-Regular.ttf');
const BOLD = path.join(FONT_DIR, 'JetBrainsMono-Bold.ttf');

let regularDataUrl: string | null = null;

/** base64 `data:` URL of the regular font, cached after first read. */
export function regularFontDataUrl(): string {
  if (regularDataUrl == null) {
    const b64 = fs.readFileSync(REGULAR).toString('base64');
    regularDataUrl = `data:font/ttf;base64,${b64}`;
  }
  return regularDataUrl;
}

/** Absolute paths to the font files (used by the GIF rasterizer in Phase B). */
export const fontFiles = { regular: REGULAR, bold: BOLD };

/**
 * `@font-face` + base-style block to inline into a standalone SVG so it renders
 * identically across GitHub, browsers and slide tools. Bold is synthesized by
 * the renderer from the regular face (keeps the SVG roughly half the size).
 */
export function fontStyleBlock(fontSize: number): string {
  return (
    `@font-face{font-family:'${FONT_FAMILY}';font-style:normal;font-weight:400;` +
    `src:url(${regularFontDataUrl()}) format('truetype');}` +
    `text{font-family:'${FONT_FAMILY}',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;` +
    `font-size:${fontSize}px;}`
  );
}
