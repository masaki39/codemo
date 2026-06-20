import {
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from 'shiki';
import { LIMITS } from './config';
import { DEFAULT_THEME, LANGS, THEMES } from './themes';
import type { Highlighted, Tok } from './types';

// FontStyle bit flags (from shiki's FontStyle enum).
const ITALIC = 1;
const BOLD = 2;

let highlighterPromise: Promise<Highlighter> | null = null;

/** Lazily create a singleton highlighter, reused across requests (warm starts). */
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [...THEMES],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

/** Truncate a tokenized line so it never exceeds `maxCols` columns. */
function clampLine(line: Tok[], maxCols: number): Tok[] {
  const out: Tok[] = [];
  let cols = 0;
  for (const tok of line) {
    if (cols >= maxCols) break;
    const len = [...tok.content].length;
    if (cols + len <= maxCols) {
      out.push(tok);
      cols += len;
    } else {
      const room = maxCols - cols;
      out.push({ ...tok, content: [...tok.content].slice(0, room).join('') });
      cols = maxCols;
    }
  }
  return out;
}

/** Tokenize `code` with shiki and normalize into our {@link Highlighted} shape. */
export async function highlight(code: string, lang: string, theme: string): Promise<Highlighted> {
  const highlighter = await getHighlighter();
  const safeTheme = highlighter.getLoadedThemes().includes(theme) ? theme : DEFAULT_THEME;
  const loadedLang = highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';

  // Values are validated above against the loaded grammars/themes; cast to
  // satisfy shiki's string-literal param types (incl. the special 'text' lang).
  const result = highlighter.codeToTokens(code, {
    lang: loadedLang as BundledLanguage,
    theme: safeTheme as BundledTheme,
  });

  const fg = result.fg ?? '#e6e6e6';
  const bg = result.bg ?? '#1e1e1e';

  let lines: Tok[][] = result.tokens.map((line) =>
    line.map((t) => {
      const style = t.fontStyle ?? 0;
      return {
        content: t.content,
        color: t.color ?? fg,
        bold: (style & BOLD) !== 0,
        italic: (style & ITALIC) !== 0,
      };
    }),
  );

  if (lines.length > LIMITS.maxLines) lines = lines.slice(0, LIMITS.maxLines);
  lines = lines.map((line) => clampLine(line, LIMITS.maxCols));

  return { lines, fg, bg };
}

/** Tokenize a single line of text (used by terminal mode to highlight commands). */
export async function tokenizeLine(text: string, lang: string, theme: string): Promise<Tok[]> {
  if (!text) return [];
  const result = await highlight(text, lang, theme);
  return result.lines[0] ?? [];
}

/** Resolve a theme's base foreground / background colors (used by terminal mode). */
export async function getThemeColors(theme: string): Promise<{ fg: string; bg: string }> {
  const highlighter = await getHighlighter();
  const name = highlighter.getLoadedThemes().includes(theme) ? theme : DEFAULT_THEME;
  const resolved = highlighter.getTheme(name as BundledTheme);
  return { fg: resolved.fg || '#e6e6e6', bg: resolved.bg || '#1e1e1e' };
}
