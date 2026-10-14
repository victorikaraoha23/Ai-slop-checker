import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import './components.css';
import './result.css';
import './lab.css';

export const metadata: Metadata = {
  title: 'slopcheck — is it AI slop?',
  description:
    'Four instruments, one verdict. Scan sites for builder fingerprints, run text engines, dissect documents, read pixels.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
