import type { CSSProperties, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JsonLd } from '@/components/json-ld';
import { Providers } from '@/app/providers';
import { brand } from '@/config/brand';
import appleSplash from '@/config/apple-splash.json';
import pwaConfig from '../../pwa.config.json';
import { siteGraph } from '@/lib/structured-data';
import { siteOrigin } from '@/lib/seo';
import '@/index.css';

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
    <html lang="en" style={brandColors}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "zbyj1kutx9");`}
        </Script>
      </body>
    </html>
  );
}
