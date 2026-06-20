'use client';

import LZString from 'lz-string';
import { useEffect, useMemo, useState } from 'react';
import { LANGS, THEMES } from './lib/themes';

const SAMPLE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

greet('codemo');`;

type Format = 'svg' | 'gif';
type Mode = 'code' | 'terminal';
type Anim = 'typing' | 'step' | 'terminal';

const label: React.CSSProperties = { fontSize: 12, color: '#555', display: 'block', marginBottom: 4 };
const field: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #d4d4d8',
  fontSize: 13,
  boxSizing: 'border-box',
};

export default function Home() {
  const [code, setCode] = useState(SAMPLE);
  const [lang, setLang] = useState('typescript');
  const [theme, setTheme] = useState('github-dark');
  const [mode, setMode] = useState<Mode>('code');
  const [format, setFormat] = useState<Format>('svg');
  const [anim, setAnim] = useState<Anim>('typing');
  const [title, setTitle] = useState('greet.ts');
  const [windowChrome, setWindowChrome] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(false);

  const path = useMemo(() => {
    const p = new URLSearchParams();
    if (code.length > 120) p.set('lz', LZString.compressToEncodedURIComponent(code));
    else p.set('code', code);
    if (mode === 'code') p.set('lang', lang);
    p.set('theme', theme);
    if (mode !== 'code') p.set('mode', mode);
    if (format === 'gif') p.set('anim', anim);
    if (title) p.set('title', title);
    if (!windowChrome) p.set('window', '0');
    if (lineNumbers) p.set('lineNumbers', '1');
    const base = format === 'gif' ? '/api/code/gif' : '/api/code';
    return `${base}?${p.toString()}`;
  }, [code, lang, theme, mode, format, anim, title, windowChrome, lineNumbers]);

  // Debounce the preview so GIF rendering isn't triggered on every keystroke.
  const [previewUrl, setPreviewUrl] = useState(path);
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setPreviewUrl(path), 500);
    return () => clearTimeout(t);
  }, [path]);
  useEffect(() => setOrigin(window.location.origin), []);

  const markdown = `![code](${origin}${previewUrl})`;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 20px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: '#18181b',
      }}
    >
      <h1 style={{ marginBottom: 4 }}>codemo</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        Syntax-highlighted code blocks as <strong>SVG</strong> &amp; animated <strong>GIF</strong>{' '}
        for Markdown and slides.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Controls */}
        <div style={{ flex: '1 1 360px', minWidth: 320 }}>
          <label style={label}>Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              ...field,
              height: 200,
              fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={label}>Format</label>
              <select style={field} value={format} onChange={(e) => setFormat(e.target.value as Format)}>
                <option value="svg">SVG (static)</option>
                <option value="gif">GIF (animated)</option>
              </select>
            </div>
            <div>
              <label style={label}>Mode</label>
              <select style={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="code">code</option>
                <option value="terminal">terminal</option>
              </select>
            </div>
            <div>
              <label style={label}>Theme</label>
              <select style={field} value={theme} onChange={(e) => setTheme(e.target.value)}>
                {THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Language</label>
              <select
                style={field}
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={mode === 'terminal'}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            {format === 'gif' && (
              <div>
                <label style={label}>Animation</label>
                <select style={field} value={anim} onChange={(e) => setAnim(e.target.value as Anim)}>
                  <option value="typing">typing</option>
                  <option value="step">step</option>
                  <option value="terminal">terminal</option>
                </select>
              </div>
            )}
            <div>
              <label style={label}>Title</label>
              <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13 }}>
            <label>
              <input
                type="checkbox"
                checked={windowChrome}
                onChange={(e) => setWindowChrome(e.target.checked)}
              />{' '}
              window
            </label>
            <label>
              <input
                type="checkbox"
                checked={lineNumbers}
                onChange={(e) => setLineNumbers(e.target.checked)}
              />{' '}
              line numbers
            </label>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: '1 1 360px', minWidth: 320 }}>
          <label style={label}>Preview</label>
          <div
            style={{
              background:
                'repeating-conic-gradient(#f3f3f4 0% 25%, #e4e4e7 0% 50%) 50% / 20px 20px',
              padding: 16,
              borderRadius: 8,
              minHeight: 120,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" style={{ maxWidth: '100%' }} />
          </div>

          <label style={{ ...label, marginTop: 12 }}>Markdown</label>
          <textarea
            readOnly
            value={markdown}
            onFocus={(e) => e.currentTarget.select()}
            style={{ ...field, height: 70, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
          />
          <button
            onClick={() => navigator.clipboard?.writeText(markdown)}
            style={{
              marginTop: 8,
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: '#18181b',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Copy Markdown
          </button>
        </div>
      </div>
    </main>
  );
}
