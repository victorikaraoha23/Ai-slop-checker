import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'slopcheck — is your site AI slop?',
  description:
    'Paste a URL or drop a screenshot. slopcheck inspects markup and pixels for tell-tale AI-generated patterns.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
