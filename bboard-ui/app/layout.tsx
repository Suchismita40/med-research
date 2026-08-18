import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Private Medical Research Data Exchange | Midnight Protocol',
  description: 'Confidential clinical dataset sharing and zero-knowledge researcher verification built on Midnight blockchain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-surface-bg text-primaryText antialiased selection:bg-olive-200 selection:text-olive-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
