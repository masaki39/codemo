import type { CodeConfig, Highlighted, Tok } from '../types';
import { sliceToCols, strCols } from '../width';

export interface Frame {
  lines: Tok[][];
  cursor: { row: number; col: number } | null;
  delayMs: number;
}

/** Upper bound on frame count to keep encoding time / GIF size in check. */
const FRAME_CAP = 80;
/** Max frames spent typing a single command line (terminal anim). */
const CMD_FRAME_CAP = 24;

/** Display-column width of a tokenized line (wide CJK glyphs count as 2). */
function lineCols(line: Tok[]): number {
  let n = 0;
  for (const t of line) n += strCols(t.content);
  return n;
}

/** Slice a tokenized line down to its first `maxCols` display columns. A wide
 *  glyph that wouldn't fully fit is dropped (never rendered half), so the
 *  revealed width can be one column short of `maxCols`. */
function sliceLine(line: Tok[], maxCols: number): Tok[] {
  if (maxCols <= 0) return [];
  const out: Tok[] = [];
  let cols = 0;
  for (const t of line) {
    const room = maxCols - cols;
    if (room <= 0) break;
    const { text, cols: tcols } = sliceToCols(t.content, room);
    if (text) out.push(text.length === t.content.length ? t : { ...t, content: text });
    cols += tcols;
    if (text.length < t.content.length) break; // truncated mid-token → stop
  }
  return out;
}

/** Reveal the first `n` display columns of the document (newlines count as 1). */
function sliceLines(lines: Tok[][], n: number): { lines: Tok[][]; cursor: { row: number; col: number } } {
  const out: Tok[][] = [];
  let remaining = n;
  let cursorRow = 0;
  let cursorCol = 0;

  for (let r = 0; r < lines.length; r++) {
    const len = lineCols(lines[r]);
    if (remaining >= len) {
      out.push(lines[r]);
      remaining -= len;
      cursorRow = r;
      cursorCol = len;
      if (r < lines.length - 1) {
        if (remaining >= 1) {
          remaining -= 1; // consume the newline
          cursorRow = r + 1;
          cursorCol = 0;
        } else {
          break;
        }
      }
    } else {
      const sliced = sliceLine(lines[r], remaining);
      out.push(sliced);
      cursorRow = r;
      cursorCol = lineCols(sliced); // actual revealed columns (≤ remaining)
      break;
    }
  }

  return { lines: out, cursor: { row: cursorRow, col: cursorCol } };
}

/** Build the animation frame list for the configured `anim` mode. */
export function buildFrames(hl: Highlighted, cfg: CodeConfig): Frame[] {
  const { lines } = hl;
  const fullFrame: Frame = {
    lines,
    cursor: null,
    delayMs: cfg.startDelay + cfg.endDelay || 1000,
  };

  if (cfg.anim === 'none' || lines.length === 0) return [fullFrame];

  const frameMs = Math.round(1000 / cfg.fps);
  const totalCols = lines.reduce((s, l) => s + lineCols(l), 0) + Math.max(0, lines.length - 1);

  const withHolds = (frames: Frame[]): Frame[] => {
    if (frames.length === 0) return [fullFrame];
    frames[0].delayMs += cfg.startDelay;
    frames[frames.length - 1].delayMs += cfg.endDelay;
    return frames;
  };

  if (cfg.anim === 'typing') {
    let step = Math.max(1, Math.round(cfg.speed / cfg.fps));
    if (Math.ceil(totalCols / step) > FRAME_CAP) step = Math.ceil(totalCols / FRAME_CAP);

    const frames: Frame[] = [];
    for (let n = 0; n < totalCols; n += step) {
      const { lines: vis, cursor } = sliceLines(lines, n);
      frames.push({ lines: vis, cursor: cfg.cursor ? cursor : null, delayMs: frameMs });
    }
    const final = sliceLines(lines, totalCols);
    frames.push({ lines: final.lines, cursor: cfg.cursor ? final.cursor : null, delayMs: frameMs });
    return withHolds(frames);
  }

  if (cfg.anim === 'step') {
    // Reveal one chunk of lines per frame (readable line-by-line build-up).
    const stepMs = Math.max(200, frameMs);
    const linesPerStep = Math.max(1, Math.ceil(lines.length / FRAME_CAP));
    const frames: Frame[] = [];
    for (let k = linesPerStep; k < lines.length; k += linesPerStep) {
      frames.push({ lines: lines.slice(0, k), cursor: null, delayMs: stepMs });
    }
    frames.push({ lines, cursor: null, delayMs: stepMs });
    return withHolds(frames);
  }

  // anim === 'terminal': type command lines, reveal output lines instantly.
  const commands = new Set(hl.commandRows ?? []);
  const frames: Frame[] = [];
  const baseStep = Math.max(1, Math.round(cfg.speed / cfg.fps));

  for (let r = 0; r < lines.length; r++) {
    const prev = lines.slice(0, r);
    if (commands.has(r)) {
      const cols = lineCols(lines[r]);
      // The prompt (first token) is shown instantly; only the command types out.
      const promptCols = lines[r].length > 0 ? strCols(lines[r][0].content) : 0;
      const step = Math.max(baseStep, Math.ceil(cols / CMD_FRAME_CAP));
      for (let c = Math.min(promptCols, cols); c < cols; c += step) {
        const sliced = sliceLine(lines[r], c);
        frames.push({
          lines: [...prev, sliced],
          cursor: cfg.cursor ? { row: r, col: lineCols(sliced) } : null,
          delayMs: frameMs,
        });
      }
      // Hold the completed command, simulating the time it takes to run.
      frames.push({
        lines: lines.slice(0, r + 1),
        cursor: cfg.cursor ? { row: r, col: cols } : null,
        delayMs: frameMs + cfg.execDelay,
      });
    } else {
      // Output lines appear one at a time, paced so they're readable.
      frames.push({
        lines: lines.slice(0, r + 1),
        cursor: null,
        delayMs: cfg.outputDelay,
      });
    }
  }
  return withHolds(frames);
}
