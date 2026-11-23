import type { CSSProperties, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { JsonLd } from '@/components/json-ld';
import { Providers } from '@/app/providers';
import { brand } from '@/config/brand';
import appleSplash from '@/config/apple-splash.json';
import pwaConfig from '../../pwa.config.json';
import { siteGraph } from '@/lib/structured-data';
import { siteOrigin } from '@/lib/seo';
import '@/index.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: 'ReelFetch',
  appleWebApp: {
    capable: true,
    title: pwaConfig.shortName,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: pwaConfig.themeColor,
};

const brandColors = {
  '--rf-accent': brand.accent,
  '--rf-accent-hover': brand.accentHover,
  '--rf-navy': brand.navy,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} style={brandColors}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {appleSplash.map((splash) => (
          <link key={`${splash.href}-${splash.media}`} rel="apple-touch-startup-image" href={splash.href} media={splash.media} />
        ))}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5871594289590523"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <JsonLd data={siteGraph()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
