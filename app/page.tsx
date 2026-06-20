'use client';

import LZString from 'lz-string';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { LANGS, THEMES } from './lib/themes';

const SAMPLE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

greet('codemo');`;

const TERM_SAMPLE = `$ npm install codemo
added 1 package in 0.4s
$ codemo render hello.ts
✓ wrote hello.gif (94 kB)`;

type Format = 'svg' | 'gif';
type Mode = 'code' | 'terminal';
type Anim = 'typing' | 'step' | 'terminal';

interface State {
  code: string;
  format: Format;
  mode: Mode;
  theme: string;
  lang: string;
  anim: Anim;
  title: string;
  showLang: boolean;
  window: boolean;
  lineNumbers: boolean;
  padding: number;
  fontSize: number;
  radius: number;
  bg: string;
  transparent: boolean;
  tabSize: number;
  speed: number;
  fps: number;
  loop: boolean;
  cursor: boolean;
  startDelay: number;
  endDelay: number;
  prompt: string;
  cmdHighlight: boolean;
  execDelay: number;
  outputDelay: number;
}

const INITIAL: State = {
  code: SAMPLE,
  format: 'svg',
  mode: 'code',
  theme: 'github-dark',
  lang: 'typescript',
  anim: 'typing',
  title: 'greet.ts',
  showLang: false,
  window: true,
  lineNumbers: false,
  padding: 24,
  fontSize: 14,
  radius: 10,
  bg: '',
  transparent: true,
  tabSize: 2,
  speed: 14,
  fps: 12,
  loop: true,
  cursor: true,
  startDelay: 400,
  endDelay: 1500,
  prompt: '$ ',
  cmdHighlight: true,
  execDelay: 300,
  outputDelay: 250,
};

// --- terminal-ish palette ---
const C = {
  bg: '#0b0e14',
  panel: '#0d1117',
  bar: '#161b22',
  border: '#222b35',
  text: '#c9d1d9',
  dim: '#9aa5b2',
  accent: '#3fb950',
  cyan: '#39c5cf',
};

const fieldStyle: CSSProperties = {
  background: C.panel,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle = (color: string): CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 6,
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
      <legend style={{ color: C.accent, fontSize: 12, padding: 0, marginBottom: 8 }}>
        <span style={{ color: C.dim }}>❯</span> {title}
      </legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
    </fieldset>
  );
}

function Row({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label style={{ display: 'block', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ display: 'block', color: C.dim, fontSize: 11, marginBottom: 3 }}>{label}</span>
      {children}
    </label>
  );
}

export default function Home() {
  const [s, setS] = useState<State>(INITIAL);
  const set = <K extends keyof State>(key: K, value: State[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const Select = (key: keyof State, options: readonly string[]) => (
    <select style={fieldStyle} value={String(s[key])} onChange={(e) => set(key, e.target.value as never)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
  const Text = (key: keyof State, placeholder = '') => (
    <input
      style={fieldStyle}
      value={String(s[key])}
      placeholder={placeholder}
      onChange={(e) => set(key, e.target.value as never)}
    />
  );
  const Num = (key: keyof State, min: number, max: number) => (
    <input
      type="number"
      min={min}
      max={max}
      style={fieldStyle}
      value={Number(s[key])}
      onChange={(e) => set(key, Math.min(max, Math.max(min, Number(e.target.value) || 0)) as never)}
    />
  );
  const Toggle = (key: keyof State, text: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontSize: 13 }}>
      <input type="checkbox" checked={Boolean(s[key])} onChange={(e) => set(key, e.target.checked as never)} />
      {text}
    </label>
  );

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (s.code.length > 120) p.set('lz', LZString.compressToEncodedURIComponent(s.code));
    else p.set('code', s.code);
    const langDefault = s.mode === 'terminal' ? 'bash' : 'text';
    const addS = (k: string, v: string, d: string) => v !== d && p.set(k, v);
    const addB = (k: string, v: boolean, d: boolean) => v !== d && p.set(k, v ? '1' : '0');
    const addN = (k: string, v: number, d: number) => v !== d && p.set(k, String(v));

    addS('theme', s.theme, 'github-dark');
    addS('lang', s.lang, langDefault);
    addS('mode', s.mode, 'code');
    if (s.format === 'gif') addS('anim', s.anim, 'typing');
    addS('title', s.title, '');
    addB('showLang', s.showLang, false);
    addB('window', s.window, true);
    addB('lineNumbers', s.lineNumbers, false);
    addN('padding', s.padding, 24);
    addN('fontSize', s.fontSize, 14);
    addN('radius', s.radius, 10);
    addS('bg', s.bg, '');
    addB('transparent', s.transparent, true);
    addN('tabSize', s.tabSize, 2);
    if (s.format === 'gif') {
      addN('speed', s.speed, 14);
      addN('fps', s.fps, 12);
      addB('loop', s.loop, true);
      addB('cursor', s.cursor, true);
      addN('startDelay', s.startDelay, 400);
      addN('endDelay', s.endDelay, 1500);
    }
    if (s.mode === 'terminal') {
      addS('prompt', s.prompt, '$ ');
      addB('cmdHighlight', s.cmdHighlight, true);
      if (s.format === 'gif') {
        addN('execDelay', s.execDelay, 300);
        addN('outputDelay', s.outputDelay, 250);
      }
    }
    const base = s.format === 'gif' ? '/api/code/gif' : '/api/code';
    return `${base}?${p.toString()}`;
  }, [s]);

  const [preview, setPreview] = useState(url);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPreview(url), 450);
    return () => clearTimeout(t);
  }, [url]);
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setPreviewError(false), [preview]);

  const markdown = `![code](${origin}${preview})`;

  const copy = () => {
    navigator.clipboard?.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const download = async () => {
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `codemo.${s.format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* ignore download errors */
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        padding: '28px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: C.panel,
        }}
      >
        {/* window bar */}
        <div
          style={{
            background: C.bar,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          <span style={{ marginLeft: 10, color: C.dim, fontSize: 13 }}>
            codemo <span style={{ color: C.accent }}>~</span> playground
          </span>
        </div>

        <div style={{ padding: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* controls */}
          <div style={{ flex: '1 1 380px', minWidth: 320 }}>
            <p style={{ marginTop: 0, color: C.dim, fontSize: 13 }}>
              <span style={{ color: C.accent }}>$</span> render code blocks as SVG &amp; animated GIF
            </p>

            <Row label="code" full>
              <textarea
                value={s.code}
                onChange={(e) => set('code', e.target.value)}
                spellCheck={false}
                style={{ ...fieldStyle, height: 170, resize: 'vertical', lineHeight: 1.5 }}
              />
            </Row>
            <div style={{ display: 'flex', gap: 14, margin: '10px 0 18px' }}>
              <button
                onClick={() =>
                  set('code', s.mode === 'terminal' ? TERM_SAMPLE : SAMPLE)
                }
                style={{ ...fieldStyle, width: 'auto', cursor: 'pointer', color: C.dim }}
              >
                load sample
              </button>
            </div>

            <Section title="content">
              <Row label="format">{Select('format', ['svg', 'gif'])}</Row>
              <Row label="mode">{Select('mode', ['code', 'terminal'])}</Row>
              <Row label="theme">{Select('theme', THEMES)}</Row>
              <Row label="language">{Select('lang', LANGS)}</Row>
              {s.format === 'gif' && <Row label="anim">{Select('anim', ['typing', 'step', 'terminal'])}</Row>}
            </Section>

            <Section title="appearance">
              <Row label="title">{Text('title', 'greet.ts')}</Row>
              <Row label="background (bg)">{Text('bg', 'theme default')}</Row>
              <Row label="padding">{Num('padding', 0, 200)}</Row>
              <Row label="fontSize">{Num('fontSize', 8, 40)}</Row>
              <Row label="radius">{Num('radius', 0, 40)}</Row>
              <Row label="tabSize">{Num('tabSize', 1, 8)}</Row>
              {Toggle('window', 'window chrome')}
              {Toggle('showLang', 'show language')}
              {Toggle('lineNumbers', 'line numbers')}
              {Toggle('transparent', 'transparent (gif)')}
            </Section>

            {s.format === 'gif' && (
              <Section title="animation">
                <Row label="speed (cps)">{Num('speed', 1, 100)}</Row>
                <Row label="fps">{Num('fps', 1, 30)}</Row>
                <Row label="startDelay (ms)">{Num('startDelay', 0, 5000)}</Row>
                <Row label="endDelay (ms)">{Num('endDelay', 0, 10000)}</Row>
                {Toggle('loop', 'loop')}
                {Toggle('cursor', 'cursor')}
              </Section>
            )}

            {s.mode === 'terminal' && (
              <Section title="terminal">
                <Row label="prompt">{Text('prompt', '$ ')}</Row>
                {Toggle('cmdHighlight', 'highlight commands')}
                {s.format === 'gif' && <Row label="execDelay (ms)">{Num('execDelay', 0, 5000)}</Row>}
                {s.format === 'gif' && <Row label="outputDelay (ms)">{Num('outputDelay', 0, 5000)}</Row>}
              </Section>
            )}
          </div>

          {/* preview */}
          <div
            style={{
              flex: '1 1 360px',
              minWidth: 320,
              position: 'sticky',
              top: 20,
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ color: C.dim, fontSize: 11, marginBottom: 6 }}>preview</div>
            <div
              style={{
                background: 'repeating-conic-gradient(#161b22 0% 25%, #0d1117 0% 50%) 50% / 18px 18px',
                padding: 16,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {previewError ? (
                <span style={{ color: '#f97583', fontSize: 13 }}>
                  couldn&rsquo;t render — check your inputs
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="preview of the rendered code block"
                  onError={() => setPreviewError(true)}
                  style={{ maxWidth: '100%' }}
                />
              )}
            </div>

            <div style={{ color: C.dim, fontSize: 11, margin: '14px 0 6px' }}>markdown</div>
            <textarea
              readOnly
              value={markdown}
              onFocus={(e) => e.currentTarget.select()}
              style={{ ...fieldStyle, height: 64, fontSize: 12, lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={copy} style={btnStyle(C.accent)}>
                {copied ? 'copied!' : 'copy markdown'}
              </button>
              <button onClick={download} style={btnStyle(C.cyan)}>
                download {s.format}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
