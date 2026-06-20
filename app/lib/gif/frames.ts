import type { CodeConfig, Highlighted, Tok } from '../types';

export interface Frame {
  lines: Tok[][];
  cursor: { row: number; col: number } | null;
  delayMs: number;
}

/** Upper bound on frame count to keep encoding time / GIF size in check. */
const FRAME_CAP = 80;
/** Max frames spent typing a single command line (terminal anim). */
const CMD_FRAME_CAP = 24;

function lineCols(line: Tok[]): number {
  let n = 0;
  for (const t of line) n += [...t.content].length;
  return n;
}

/** Slice a tokenized line down to its first `k` visible characters. */
function sliceLine(line: Tok[], k: number): Tok[] {
  if (k <= 0) return [];
  const out: Tok[] = [];
  let count = 0;
  for (const t of line) {
    const chars = [...t.content];
    if (count + chars.length <= k) {
      out.push(t);
      count += chars.length;
    } else {
      out.push({ ...t, content: chars.slice(0, k - count).join('') });
      break;
    }
  }
  return out;
}

/** Reveal the first `n` characters of the document (newlines count as 1 char). */
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
      out.push(sliceLine(lines[r], remaining));
      cursorRow = r;
      cursorCol = remaining;
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
  const totalChars = lines.reduce((s, l) => s + lineCols(l), 0) + Math.max(0, lines.length - 1);

  const withHolds = (frames: Frame[]): Frame[] => {
    if (frames.length === 0) return [fullFrame];
    frames[0].delayMs += cfg.startDelay;
    frames[frames.length - 1].delayMs += cfg.endDelay;
    return frames;
  };

  if (cfg.anim === 'typing') {
    let step = Math.max(1, Math.round(cfg.speed / cfg.fps));
    if (Math.ceil(totalChars / step) > FRAME_CAP) step = Math.ceil(totalChars / FRAME_CAP);

    const frames: Frame[] = [];
    for (let n = 0; n < totalChars; n += step) {
      const { lines: vis, cursor } = sliceLines(lines, n);
      frames.push({ lines: vis, cursor: cfg.cursor ? cursor : null, delayMs: frameMs });
    }
    const final = sliceLines(lines, totalChars);
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
      const step = Math.max(baseStep, Math.ceil(cols / CMD_FRAME_CAP));
      for (let c = 0; c < cols; c += step) {
        frames.push({
          lines: [...prev, sliceLine(lines[r], c)],
          cursor: cfg.cursor ? { row: r, col: c } : null,
          delayMs: frameMs,
        });
      }
      frames.push({
        lines: lines.slice(0, r + 1),
        cursor: cfg.cursor ? { row: r, col: cols } : null,
        delayMs: frameMs,
      });
    } else {
      frames.push({
        lines: lines.slice(0, r + 1),
        cursor: null,
        delayMs: Math.max(120, frameMs),
      });
    }
  }
  return withHolds(frames);
}
