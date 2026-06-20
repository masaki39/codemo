import { LIMITS } from './config';
import { getThemeColors } from './highlight';
import type { Highlighted, Tok } from './types';

/** Color used for the shell prompt prefix on command lines. */
const PROMPT_COLOR = '#3fb950';

/**
 * Render raw text as a terminal session. Lines beginning with `prompt`
 * (default `$ `) are treated as commands — the prompt is drawn in an accent
 * color — and every other line is output in the theme foreground color.
 */
export async function terminalize(
  code: string,
  theme: string,
  prompt: string,
): Promise<Highlighted> {
  const { fg, bg } = await getThemeColors(theme);
  const commandRows: number[] = [];

  const rawLines = code
    .split('\n')
    .slice(0, LIMITS.maxLines)
    .map((l) => [...l].slice(0, LIMITS.maxCols).join(''));

  const lines: Tok[][] = rawLines.map((line, r) => {
    if (prompt && line.startsWith(prompt)) {
      commandRows.push(r);
      return [
        { content: prompt, color: PROMPT_COLOR, bold: true, italic: false },
        { content: line.slice(prompt.length), color: fg, bold: false, italic: false },
      ];
    }
    return [{ content: line, color: fg, bold: false, italic: false }];
  });

  return { lines, fg, bg, commandRows };
}
