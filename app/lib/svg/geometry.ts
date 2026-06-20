import type { CodeConfig, Tok } from '../types';
import { CHAR_ADVANCE } from './font';

export interface Geometry {
  charWidth: number;
  lineHeight: number;
  padX: number;
  padY: number;
  gutterWidth: number; // width reserved for line-number digits (0 if disabled)
  gutterGap: number; // gap between gutter and code
  barHeight: number; // window title-bar height (0 if window disabled)
  contentX: number; // left x where code text starts
  contentTop: number; // top y of the first code line block
  width: number;
  height: number;
  rows: number;
  cols: number;
}

function lineCols(line: Tok[]): number {
  let n = 0;
  for (const t of line) n += [...t.content].length;
  return n;
}

/**
 * Compute canvas geometry from the full set of lines. Animation frames reuse the
 * same geometry so the canvas size stays constant across frames.
 */
export function computeGeometry(lines: Tok[][], cfg: CodeConfig): Geometry {
  const { fontSize } = cfg;
  const charWidth = fontSize * CHAR_ADVANCE;
  const lineHeight = Math.round(fontSize * 1.5);
  const rows = Math.max(lines.length, 1);
  const cols = Math.max(1, ...lines.map(lineCols));

  const padX = cfg.padding;
  const padY = cfg.padding;
  const barHeight = cfg.window ? Math.round(fontSize * 2.4) : 0;

  const digits = String(rows).length;
  const gutterWidth = cfg.lineNumbers ? Math.ceil(digits * charWidth) : 0;
  const gutterGap = cfg.lineNumbers ? Math.round(charWidth * 2) : 0;

  const contentX = padX + gutterWidth + gutterGap;
  const contentTop = barHeight + padY;

  const codeWidth = Math.ceil(cols * charWidth);
  let width = Math.ceil(contentX + codeWidth + padX);
  // Ensure narrow content still fits the title-bar traffic lights.
  if (cfg.window) {
    const r = Math.max(3, Math.round(fontSize * 0.28));
    width = Math.max(width, padX * 2 + Math.ceil(r * 9));
  }
  const height = Math.ceil(contentTop + rows * lineHeight + padY);

  return {
    charWidth,
    lineHeight,
    padX,
    padY,
    gutterWidth,
    gutterGap,
    barHeight,
    contentX,
    contentTop,
    width,
    height,
    rows,
    cols,
  };
}
