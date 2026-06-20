import { decodeCode } from './encoding';
import { resolveLang, resolveTheme } from './themes';
import type { Anim, CodeConfig, Format, Mode } from './types';

/** Hard limits to bound work / response size and protect against abuse. */
export const LIMITS = {
  maxCodeLength: 20000,
  maxLines: 200,
  maxCols: 400,
} as const;

function num(value: string | null, fallback: number, min: number, max: number): number {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(value: string | null, fallback: boolean): boolean {
  if (value == null) return fallback;
  return value === '1' || value === 'true' || value === 'yes';
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const MODES: readonly Mode[] = ['code', 'terminal'];
const ANIMS: readonly Anim[] = ['none', 'typing', 'step', 'terminal'];

/** Parse and validate the request query string into a fully resolved config. */
export function parseConfig(params: URLSearchParams, format: Format): CodeConfig {
  const tabSize = num(params.get('tabSize'), 2, 1, 8);

  let code = decodeCode(params);
  if (code.length > LIMITS.maxCodeLength) code = code.slice(0, LIMITS.maxCodeLength);
  // Normalize newlines and expand tabs so column math stays consistent.
  code = code.replace(/\r\n?/g, '\n').replace(/\t/g, ' '.repeat(tabSize));

  const defaultAnim: Anim = format === 'gif' ? 'typing' : 'none';

  return {
    code,
    lang: resolveLang(params.get('lang') ?? ''),
    theme: resolveTheme(params.get('theme') ?? ''),
    mode: oneOf(params.get('mode'), MODES, 'code'),
    anim: format === 'svg' ? 'none' : oneOf(params.get('anim'), ANIMS, defaultAnim),
    format,

    padding: num(params.get('padding'), 24, 0, 200),
    fontSize: num(params.get('fontSize'), 14, 8, 40),
    lineNumbers: bool(params.get('lineNumbers'), false),
    window: bool(params.get('window'), true),
    title: (params.get('title') ?? '').slice(0, 120),
    radius: num(params.get('radius'), 10, 0, 40),
    bg: params.get('bg'),
    tabSize,

    speed: num(params.get('speed'), 14, 1, 100),
    fps: num(params.get('fps'), 12, 1, 30),
    loop: bool(params.get('loop'), true),
    cursor: bool(params.get('cursor'), true),
    startDelay: num(params.get('startDelay'), 400, 0, 5000),
    endDelay: num(params.get('endDelay'), 1500, 0, 10000),

    prompt: (params.get('prompt') ?? '$ ').slice(0, 16),
  };
}
