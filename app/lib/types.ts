export type Mode = 'code' | 'terminal';
export type Anim = 'none' | 'typing' | 'step' | 'terminal';
export type Format = 'svg' | 'gif';

/** A single highlighted token within a line. */
export interface Tok {
  content: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

/** Result of syntax highlighting: tokens per line plus theme colors. */
export interface Highlighted {
  lines: Tok[][];
  fg: string;
  bg: string;
  /** Row indices that are shell commands (terminal mode only). */
  commandRows?: number[];
}

/** Fully resolved request configuration. */
export interface CodeConfig {
  code: string;
  lang: string;
  theme: string;
  mode: Mode;
  anim: Anim;
  format: Format;

  // layout / appearance
  padding: number;
  fontSize: number;
  lineNumbers: boolean;
  window: boolean;
  title: string;
  radius: number;
  bg: string | null;
  tabSize: number;

  // animation (GIF)
  speed: number; // characters per second (typing) / lines per second (step)
  fps: number;
  loop: boolean;
  cursor: boolean;
  startDelay: number; // ms held on the first frame
  endDelay: number; // ms held on the last frame

  // terminal
  prompt: string;
}
