export const metadata = {
  title: 'codemo',
  description: 'Syntax-highlighted code blocks as SVG and GIF for Markdown and slides',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
