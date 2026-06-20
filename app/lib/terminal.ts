import { LIMITS } from './config';
import { getThemeColors, tokenizeLine } from './highlight';
import type { Highlighted, Tok } from './types';
import { sliceToCols } from './width';

/** Color used for the shell prompt prefix on command lines. */
const PROMPT_COLOR = '#3fb950';

/**
 * Render raw text as a terminal session. Lines beginning with `prompt`
 * (default `$ `) are treated as commands — the prompt is drawn in an accent
 * color and (when `cmdHighlight`) the command is syntax-highlighted with `lang`
 * (defaults to bash) — and every other line is output in the theme foreground.
 */
export async function terminalize(
  code: string,
  theme: string,
  prompt: string,
  lang: string,
  cmdHighlight: boolean,
): Promise<Highlighted> {
  const { fg, bg } = await getThemeColors(theme);
  const commandRows: number[] = [];

  const rawLines = code
    .split('\n')
    .slice(0, LIMITS.maxLines)
    .map((l) => sliceToCols(l, LIMITS.maxCols).text);

  const lines: Tok[][] = await Promise.all(
    rawLines.map(async (line, r): Promise<Tok[]> => {
      if (prompt && line.startsWith(prompt)) {
        commandRows.push(r);
        const cmd = line.slice(prompt.length);
        const cmdTokens: Tok[] =
          cmdHighlight && cmd
            ? await tokenizeLine(cmd, lang, theme)
            : [{ content: cmd, color: fg, bold: false, italic: false }];
        return [{ content: prompt, color: PROMPT_COLOR, bold: true, italic: false }, ...cmdTokens];
      }
      return [{ content: line, color: fg, bold: false, italic: false }];
    }),
  );

  return { lines, fg, bg, commandRows };
}
