import type { Metadata, Viewport } from 'next';
import './globals.css';

const DESCRIPTION =
  'Syntax-highlighted code blocks as SVG and animated GIF, for embedding in Markdown and HTML slides.';

export const metadata: Metadata = {
  metadataBase: new URL('https://codemo.masaki39.net'),
  title: 'codemo',
  description: DESCRIPTION,
  keywords: ['code', 'syntax highlighting', 'svg', 'gif', 'markdown', 'slides', 'shiki'],
  alternates: { canonical: '/' },
  authors: [{ name: 'masaki39', url: 'https://github.com/masaki39' }],
  creator: 'masaki39',
  openGraph: {
    title: 'codemo',
    description: DESCRIPTION,
    url: 'https://codemo.masaki39.net',
    siteName: 'codemo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'codemo',
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0e14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
