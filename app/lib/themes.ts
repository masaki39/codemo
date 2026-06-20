import type { BundledLanguage, BundledTheme } from 'shiki';

/**
 * Curated set of themes and languages that are eagerly loaded into the
 * highlighter. Kept intentionally bounded to limit the serverless bundle size.
 * Add more here as needed (each adds a TextMate grammar / theme JSON).
 */
export const THEMES = [
  'github-dark',
  'github-light',
  'dracula',
  'nord',
  'one-dark-pro',
  'monokai',
  'vitesse-dark',
  'vitesse-light',
  'catppuccin-mocha',
  'tokyo-night',
] as const satisfies readonly BundledTheme[];

export const LANGS = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'json',
  'python',
  'rust',
  'go',
  'bash',
  'html',
  'css',
  'markdown',
  'yaml',
  'sql',
  'c',
  'cpp',
  'java',
  'ruby',
  'php',
  'diff',
] as const satisfies readonly BundledLanguage[];

export const DEFAULT_THEME = 'github-dark';
export const DEFAULT_LANG = 'text'; // shiki special plain-text language (always available)

const THEME_SET = new Set<string>(THEMES);
const LANG_SET = new Set<string>([...LANGS, 'text', 'plaintext', 'txt']);

/** Common language aliases mapped to their loaded grammar id. */
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  'c++': 'cpp',
  plaintext: 'text',
  txt: 'text',
  '': 'text',
};

export function resolveTheme(theme: string): string {
  return THEME_SET.has(theme) ? theme : DEFAULT_THEME;
}

export function resolveLang(lang: string): string {
  const normalized = lang.toLowerCase();
  const aliased = LANG_ALIASES[normalized] ?? normalized;
  return LANG_SET.has(aliased) ? aliased : DEFAULT_LANG;
}
