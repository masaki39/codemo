import type { CodeConfig, Highlighted, Tok } from '../types';
import { FONT_FAMILY, fontStyleBlock } from './font';
import { computeGeometry, type Geometry } from './geometry';

const FONT_STACK = `'${FONT_FAMILY}',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface FrameOptions {
  /** Inline the font as base64 so the SVG renders standalone (true for SVG output). */
  embedFont: boolean;
  /** Block cursor position (0-based row/col), e.g. for typing animation. */
  cursor?: { row: number; col: number } | null;
}

/** Render one `<text>` element for a tokenized line. Tspans are concatenated
 *  with no intervening whitespace so `xml:space="preserve"` keeps columns exact. */
function renderLine(line: Tok[], centerY: number, contentX: number, fontSize: number): string {
  if (line.length === 0) return '';
  const spans = line
    .map((t) => {
      if (t.content.length === 0) return '';
      const weight = t.bold ? ' font-weight="bold"' : '';
      const style = t.italic ? ' font-style="italic"' : '';
      return `<tspan fill="${t.color}"${weight}${style}>${escapeXml(t.content)}</tspan>`;
    })
    .join('');
  return (
    `<text x="${contentX}" y="${centerY}" xml:space="preserve" ` +
    `font-family="${FONT_STACK}" font-size="${fontSize}px" dominant-baseline="central">${spans}</text>`
  );
}

function renderGutter(rowCount: number, geo: Geometry, cfg: CodeConfig, fg: string): string {
  const x = geo.padX + geo.gutterWidth;
  const parts: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const centerY = geo.contentTop + i * geo.lineHeight + geo.lineHeight / 2;
    parts.push(
      `<text x="${x}" y="${centerY}" text-anchor="end" fill="${fg}" fill-opacity="0.35" ` +
        `font-family="${FONT_STACK}" font-size="${cfg.fontSize}px" dominant-baseline="central">${i + 1}</text>`,
    );
  }
  return parts.join('');
}

function renderTitleBar(geo: Geometry, cfg: CodeConfig, fg: string): string {
  const r = Math.max(3, Math.round(cfg.fontSize * 0.28));
  const cy = geo.barHeight / 2;
  const x0 = geo.padX + r;
  const gap = r * 3.2;
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
    .map((c, i) => `<circle cx="${x0 + i * gap}" cy="${cy}" r="${r}" fill="${c}"/>`)
    .join('');
  let title = '';
  if (cfg.title) {
    title =
      `<text x="${geo.width / 2}" y="${cy}" text-anchor="middle" fill="${fg}" fill-opacity="0.55" ` +
      `font-family="${FONT_STACK}" font-size="${Math.round(cfg.fontSize * 0.85)}px" ` +
      `dominant-baseline="central">${escapeXml(cfg.title)}</text>`;
  }
  return dots + title;
}

function renderCursor(
  cursor: { row: number; col: number },
  geo: Geometry,
  cfg: CodeConfig,
  fg: string,
): string {
  const w = geo.charWidth;
  const h = Math.round(cfg.fontSize * 1.15);
  const x = geo.contentX + cursor.col * geo.charWidth;
  const y = geo.contentTop + cursor.row * geo.lineHeight + (geo.lineHeight - h) / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${fg}" fill-opacity="0.75"/>`;
}

/** Render a single frame (or the whole static image) to an SVG string. */
export function renderFrame(
  lines: Tok[][],
  hl: Highlighted,
  cfg: CodeConfig,
  geo: Geometry,
  opts: FrameOptions,
): string {
  const bg = cfg.bg || hl.bg;
  const { width, height } = geo;

  const defs = opts.embedFont
    ? `<defs><style>${fontStyleBlock(cfg.fontSize)}</style></defs>`
    : '';

  const body = lines
    .map((line, i) =>
      renderLine(line, geo.contentTop + i * geo.lineHeight + geo.lineHeight / 2, geo.contentX, cfg.fontSize),
    )
    .join('');

  const gutter = cfg.lineNumbers ? renderGutter(geo.rows, geo, cfg, hl.fg) : '';
  const bar = cfg.window ? renderTitleBar(geo, cfg, hl.fg) : '';
  const cursor = opts.cursor ? renderCursor(opts.cursor, geo, cfg, hl.fg) : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="code">` +
    defs +
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${cfg.radius}" fill="${bg}" stroke="rgba(127,127,127,0.18)" stroke-width="1"/>` +
    bar +
    gutter +
    body +
    cursor +
    `</svg>`
  );
}

/** Render the complete static SVG for the given highlighted code. */
export function renderSvg(hl: Highlighted, cfg: CodeConfig): string {
  const geo = computeGeometry(hl.lines, cfg);
  return renderFrame(hl.lines, hl, cfg, geo, { embedFont: true });
}
